import numpy as np
import tensorflow as tf
import matplotlib.cm as cm
from PIL import Image
import io, base64

MODEL_PATH = "model/best_densenet.h5"
THRESHOLD = 0.42
IMG_SIZE = (224, 224)

_model = None

def get_model():
    global _model
    if _model is None:
        _model = tf.keras.models.load_model(MODEL_PATH)
    return _model


def _preprocess(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB").resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)


def _find_last_conv(model) -> str:
    """Return the name of the last Conv2D layer in the model."""
    last = None
    for layer in model.layers:
        if isinstance(layer, tf.keras.layers.Conv2D):
            last = layer.name
    if last is None:
        raise RuntimeError("No Conv2D layer found in model.")
    return last


def _gradcam(model, img_array: np.ndarray) -> np.ndarray:
    """
    Compute Grad-CAM heatmap.
    Uses ONE combined model with a SINGLE forward pass so that features and
    class_score share the same computation graph inside the GradientTape.
    """
    last_conv_name = _find_last_conv(model)

    # Single model: outputs [conv_features, prediction]
    # Both tensors must come from ONE call for tape.gradient to work
    last_conv_output = model.get_layer(last_conv_name).output
    model_output     = model.outputs[0] if isinstance(model.outputs, list) else model.output
    combined = tf.keras.Model(inputs=model.inputs,
                               outputs=[last_conv_output, model_output])

    img_tf = tf.constant(img_array, dtype=tf.float32)

    with tf.GradientTape() as tape:
        features, scores = combined(img_tf, training=False)   # single pass
        class_score = tf.squeeze(scores)

    grads = tape.gradient(class_score, features)

    if grads is None:
        raise RuntimeError("Grad-CAM: gradient is None — disconnected graph.")

    pooled  = tf.reduce_mean(grads, axis=[0, 1, 2])            # (C,)
    heatmap = tf.einsum("hwc,c->hw", features[0], pooled)      # (h, w)
    heatmap = tf.nn.relu(heatmap)
    heatmap = heatmap / (tf.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy()



def _overlay_heatmap(heatmap: np.ndarray, original: np.ndarray) -> str:
    """Resize heatmap, overlay on original image, return base64 PNG."""
    h_resized = tf.image.resize(
        heatmap[..., np.newaxis], IMG_SIZE
    ).numpy().squeeze()

    colormap = cm.get_cmap("jet")
    colored  = colormap(h_resized)[:, :, :3]            # (H, W, 3)

    blended  = (0.4 * colored + 0.6 * original[0]).clip(0, 1)
    pil_img  = Image.fromarray((blended * 255).astype(np.uint8))

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def predict(image_bytes: bytes) -> dict:
    model = get_model()
    img   = _preprocess(image_bytes)

    raw = model.predict(img, verbose=0)
    # raw can be ndarray (1,1) or list — normalise to scalar
    probability = float(np.squeeze(raw))

    diagnosis = "PNEUMONIA" if probability >= THRESHOLD else "NORMAL"

    heatmap    = _gradcam(model, img)
    heatmap_b64 = _overlay_heatmap(heatmap, img)

    return {
        "diagnosis":    diagnosis,
        "probability":  round(probability, 4),
        "confidence":   round(max(probability, 1 - probability), 4),
        "threshold":    THRESHOLD,
        "heatmap":      heatmap_b64,
        "model_metrics": {
            "auc_roc":     0.9649,
            "sensitivity": 0.9513,
            "specificity": 0.8333,
        },
    }
