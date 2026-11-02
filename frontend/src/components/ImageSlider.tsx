import { useEffect, useState } from 'react'

export type Slide = {
  src: string
  caption: string
}

export default function ImageSlider({ slides, interval = 6000 }: {
  slides: Slide[]
  interval?: number
}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (slides.length < 2) return

    const timer = setInterval(
      () => setCurrent(index => (index + 1) % slides.length),
      interval,
    )

    return () => clearInterval(timer)
  }, [slides.length, interval])

  return (
    <div className="slider">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt=""
          aria-hidden="true"
          className={index === current ? 'slider__frame is-current' : 'slider__frame'}
        />
      ))}

      <div className="slider__scrim" />

      <div className="slider__dots">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={index === current ? 'slider__dot is-current' : 'slider__dot'}
            aria-label={`Show ${slide.caption}`}
            aria-current={index === current}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  )
}
