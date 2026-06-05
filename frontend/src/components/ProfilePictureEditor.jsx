import { useEffect, useMemo, useRef, useState } from 'react'

const EDITOR_SIZE = 280
const OUTPUT_SIZE = 512

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getPoint(event) {
  const source = event.touches?.[0] || event
  return { x: source.clientX, y: source.clientY }
}

export default function ProfilePictureEditor({ file, onCancel, onSave }) {
  const imageRef = useRef(null)
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) return undefined

    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setError('')

    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale = useMemo(() => {
    const widthScale = EDITOR_SIZE / imageSize.width
    const heightScale = EDITOR_SIZE / imageSize.height
    return Math.max(widthScale, heightScale)
  }, [imageSize])

  const displaySize = useMemo(() => ({
    width: imageSize.width * baseScale * zoom,
    height: imageSize.height * baseScale * zoom,
  }), [baseScale, imageSize, zoom])

  const maxOffset = useMemo(() => ({
    x: Math.max(0, (displaySize.width - EDITOR_SIZE) / 2),
    y: Math.max(0, (displaySize.height - EDITOR_SIZE) / 2),
  }), [displaySize])

  useEffect(() => {
    setOffset((current) => ({
      x: clamp(current.x, -maxOffset.x, maxOffset.x),
      y: clamp(current.y, -maxOffset.y, maxOffset.y),
    }))
  }, [maxOffset])

  if (!file) {
    return null
  }

  function handleImageLoad(event) {
    setImageSize({
      width: event.currentTarget.naturalWidth || 1,
      height: event.currentTarget.naturalHeight || 1,
    })
  }

  function beginDrag(event) {
    event.preventDefault()
    const point = getPoint(event)
    dragRef.current = {
      startX: point.x,
      startY: point.y,
      initialOffset: offset,
    }
  }

  function moveDrag(event) {
    if (!dragRef.current) return
    event.preventDefault()

    const point = getPoint(event)
    const nextX = dragRef.current.initialOffset.x + point.x - dragRef.current.startX
    const nextY = dragRef.current.initialOffset.y + point.y - dragRef.current.startY

    setOffset({
      x: clamp(nextX, -maxOffset.x, maxOffset.x),
      y: clamp(nextY, -maxOffset.y, maxOffset.y),
    })
  }

  function endDrag() {
    dragRef.current = null
  }

  async function handleSave() {
    const image = imageRef.current
    if (!image) return

    setIsSaving(true)
    setError('')

    try {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const context = canvas.getContext('2d')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      const scale = OUTPUT_SIZE / EDITOR_SIZE
      const drawWidth = displaySize.width * scale
      const drawHeight = displaySize.height * scale
      const drawX = ((EDITOR_SIZE - displaySize.width) / 2 + offset.x) * scale
      const drawY = ((EDITOR_SIZE - displaySize.height) / 2 + offset.y) * scale

      context.drawImage(image, drawX, drawY, drawWidth, drawHeight)

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      if (!blob) {
        throw new Error('Could not prepare the cropped image.')
      }

      const editedFile = new File([blob], 'profile-picture.jpg', { type: 'image/jpeg' })
      await onSave(editedFile)
    } catch (err) {
      setError(err.message || 'Could not save this profile picture.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface">Edit profile picture</h3>
            <p className="mt-1 text-sm text-on-surface-variant">Drag to reposition and use zoom to frame your face.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close editor"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div
          ref={viewportRef}
          className="relative mx-auto h-[280px] w-[280px] touch-none overflow-hidden rounded-full border-4 border-primary/20 bg-surface-container"
          onMouseDown={beginDrag}
          onMouseMove={moveDrag}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={beginDrag}
          onTouchMove={moveDrag}
          onTouchEnd={endDrag}
        >
          {imageUrl ? (
            <img
              ref={imageRef}
              src={imageUrl}
              alt=""
              draggable="false"
              onLoad={handleImageLoad}
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : null}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-on-surface-variant">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {error ? <p className="mt-3 text-sm font-semibold text-error">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save picture'}
          </button>
        </div>
      </div>
    </div>
  )
}
