const WEDDING_EVENTS = [
  {
    time: '10:00 AM',
    title: 'Guests Arrival',
    description:
      'Welcome drinks, greetings and a little time to settle in before the ceremony.',
  },
  {
    time: '11:00 AM',
    title: 'Wedding Ceremony',
    description:
      'The moment we say our vows and begin this beautiful new chapter together.',
  },
  {
    time: '12:30 PM',
    title: 'Photo Session',
    description:
      'A little time for photographs, memories and beautiful moments with our loved ones.',
  },
  {
    time: '02:00 PM',
    title: 'Wedding Reception',
    description:
      'Join us for a warm celebration filled with laughter, music and happy memories.',
  },
  {
    time: '06:00 PM',
    title: 'Dinner & Celebration',
    description:
      'An evening of delicious food, heartfelt speeches and unforgettable moments.',
  },
  {
    time: '08:00 PM',
    title: 'Dance & Party',
    description:
      'Let the music play and celebrate with us until the night comes to an end.',
  },
]
function WeddingTimelineSection() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useScrollProgress(ref)

  const cardY = -p * 30
  const cardRot = p * 3

  return (
    <section
      ref={ref}
      style={{
        height: '200vh',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          background: '#faf8f5',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            padding: 'clamp(2rem, 5vw, 5rem)',
            gap: 'clamp(2rem, 6vw, 6rem)',
            alignItems: 'center',
          }}
        >
          {/* LEFT — Wedding Tag */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `translateY(${cardY}px) rotate(${cardRot}deg)`,
              transition: 'transform 0.05s linear',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 280,
                minHeight: 390,
                background: '#fff',
                border: '1px solid rgba(139,26,46,0.12)',
                boxShadow: '12px 25px 60px rgba(80,40,50,0.12)',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              {/* top hole */}
              <div
                style={{
                  position: 'absolute',
                  top: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: '1px solid #8b1a2e',
                  background: '#faf8f5',
                }}
              />

              {/* ribbon */}
              <div
                style={{
                  position: 'absolute',
                  top: 23,
                  left: '50%',
                  width: 1,
                  height: 42,
                  background: '#8b1a2e',
                  opacity: 0.35,
                }}
              />

              {/* floral decoration */}
              <div
                style={{
                  marginTop: 35,
                  marginBottom: 25,
                  fontSize: 28,
                  color: '#8b1a2e',
                  letterSpacing: 8,
                }}
              >
                ❀
              </div>

              <p
                className="font-serif-light"
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.4em',
                  color: '#8b1a2e',
                  marginBottom: 18,
                }}
              >
                WEDDING DAY
              </p>

              <h3
                className="font-display"
                style={{
                  fontSize: '2.2rem',
                  color: '#1a0a10',
                  lineHeight: 1.1,
                  marginBottom: 20,
                }}
              >
                Our
                <br />
                Special Day
              </h3>

              <div
                style={{
                  width: 45,
                  height: 1,
                  background: '#8b1a2e',
                  margin: '0 auto 20px',
                }}
              />

              <p
                className="font-serif-light"
                style={{
                  fontSize: '0.85rem',
                  lineHeight: 1.8,
                  color: '#7a5060',
                }}
              >
                Join us as we celebrate
                <br />
                love, laughter and
                <br />
                a lifetime together.
              </p>

              <p
                className="font-display italic"
                style={{
                  marginTop: 28,
                  fontSize: '1.1rem',
                  color: '#8b1a2e',
                }}
              >
                15 · 09 · 2026
              </p>

              {/* bottom decoration */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: '#8b1a2e',
                  fontSize: 18,
                }}
              >
                ♡
              </div>
            </div>
          </div>

          {/* RIGHT — Wedding Timeline */}
          <div>
            <p
              className="font-serif-light text-xs tracking-[0.45em] uppercase mb-2"
              style={{ color: '#8b1a2e' }}
            >
              The Celebration
            </p>

            <h2
              className="font-display mb-10"
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                color: '#1a0a10',
              }}
            >
              Our Wedding Day
            </h2>

            <div
              style={{
                position: 'relative',
                paddingLeft: 30,
              }}
            >
              {/* timeline line */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 1,
                  height: `${Math.min(100, p * 280)}%`,
                  background:
                    'linear-gradient(to bottom, transparent, #8b1a2e 15%, #8b1a2e 85%, transparent)',
                  transition: 'height 0.1s linear',
                }}
              />

              {WEDDING_EVENTS.map((event, i) => {
                const visible = p > i * 0.18

                return (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      paddingBottom:
                        i < WEDDING_EVENTS.length - 1
                          ? '2rem'
                          : 0,

                      opacity: visible ? 1 : 0.2,

                      transform: `translateY(${
                        visible ? 0 : 12
                      }px)`,

                      transition:
                        'opacity 0.6s ease, transform 0.6s ease',
                    }}
                  >
                    {/* timeline dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: -34,
                        top: 4,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#8b1a2e',
                        boxShadow:
                          '0 0 0 4px rgba(139,26,46,0.08)',
                      }}
                    />

                    <p
                      className="font-serif-light text-xs tracking-[0.3em] mb-1"
                      style={{
                        color: '#8b1a2e',
                      }}
                    >
                      {event.time}
                    </p>

                    <h3
                      className="font-display mb-1"
                      style={{
                        fontSize: '1.15rem',
                        color: '#1a0a10',
                      }}
                    >
                      {event.title}
                    </h3>

                    <p
                      className="font-serif-light text-sm leading-relaxed"
                      style={{
                        color: '#7a5060',
                        maxWidth: 420,
                      }}
                    >
                      {event.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}