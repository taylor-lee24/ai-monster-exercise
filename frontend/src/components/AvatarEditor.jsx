import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Upload, Trash2 } from 'lucide-react';

const CANVAS_SIZE = 300;
const OUTPUT_SIZE = 256;
const CORNER_RADIUS = 54;
const OUTPUT_CORNER = Math.round(CORNER_RADIUS * (OUTPUT_SIZE / CANVAS_SIZE));

export default function AvatarEditor({ imageSrc, onSave, onCancel, onUploadNew, onDelete }) {
  const canvasRef = useRef(null);
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const getScaledSize = useCallback((image, z) => {
    if (!image) return { w: 0, h: 0 };
    const baseScale = Math.max(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height);
    const scale = baseScale * z;
    return { w: image.width * scale, h: image.height * scale };
  }, []);

  const clampOffset = useCallback((ox, oy, image, z) => {
    if (!image) return { x: 0, y: 0 };
    const { w, h } = getScaledSize(image, z);
    const maxX = (w - CANVAS_SIZE) / 2;
    const maxY = (h - CANVAS_SIZE) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    };
  }, [getScaledSize]);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setImg(image);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    image.src = imageSrc;
  }, [imageSrc]);

  const getDrawParams = useCallback(() => {
    if (!img) return null;
    const { w, h } = getScaledSize(img, zoom);
    const x = (CANVAS_SIZE - w) / 2 + offset.x;
    const y = (CANVAS_SIZE - h) / 2 + offset.y;
    return { w, h, x, y };
  }, [img, zoom, offset, getScaledSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const params = getDrawParams();
    if (!params) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_SIZE, CANVAS_SIZE, CORNER_RADIUS);
    ctx.clip();
    ctx.drawImage(img, params.x, params.y, params.w, params.h);
    ctx.restore();
  }, [img, zoom, offset, getDrawParams]);

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging || !img) return;
    const rawX = dragStart.current.ox + (e.clientX - dragStart.current.x);
    const rawY = dragStart.current.oy + (e.clientY - dragStart.current.y);
    setOffset(clampOffset(rawX, rawY, img, zoom));
  };

  const handlePointerUp = () => setDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    if (!img) return;
    const newZoom = Math.min(4, Math.max(1, zoom - e.deltaY * 0.002));
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, img, newZoom));
  };

  const handleZoomChange = (e) => {
    if (!img) return;
    const newZoom = parseFloat(e.target.value);
    setZoom(newZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, img, newZoom));
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = () => {
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d');
    const params = getDrawParams();
    if (!params) return;

    const ratio = OUTPUT_SIZE / CANVAS_SIZE;
    ctx.beginPath();
    ctx.roundRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE, OUTPUT_CORNER);
    ctx.clip();
    ctx.drawImage(img, params.x * ratio, params.y * ratio, params.w * ratio, params.h * ratio);

    onSave(out.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="avatar-editor-backdrop" onClick={onCancel}>
      <div className="avatar-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-editor-header">
          <h3>Edit Photo</h3>
          <button type="button" className="avatar-editor-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="avatar-editor-body">
          <div className="avatar-editor-canvas-wrap">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="avatar-editor-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            />
            <div className="avatar-editor-ring" />
          </div>

          <div className="avatar-editor-controls">
            <ZoomOut size={16} className="zoom-icon" />
            <input
              type="range"
              min="1"
              max="4"
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              className="avatar-editor-slider"
            />
            <ZoomIn size={16} className="zoom-icon" />
            <button type="button" className="avatar-editor-reset" onClick={handleReset} title="Reset">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="avatar-editor-footer">
          <div className="avatar-editor-footer-left">
            {onUploadNew && (
              <button type="button" className="btn-ghost" onClick={onUploadNew}>
                <Upload size={16} />
                Upload
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn-danger-ghost" onClick={onDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="avatar-editor-footer-right">
            <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              <Check size={18} />
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
