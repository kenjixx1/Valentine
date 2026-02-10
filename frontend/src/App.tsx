import { useState, useRef, useEffect } from 'react'
import RepelButton from './RepellButton/RepelButton'
import styles from './App.module.css'
import ss from "./assets/flower-cat.png"
import cat1 from "./assets/cat1.png"
import cat2 from "./assets/cat2.png"
import cat3 from "./assets/cat3.png"
import cat4 from "./assets/cat4.png"
import cat5 from "./assets/cat5.jpg"
import ticket from "./assets/ticket.png"

//Updated


function App() {
  const [accepted, setAccepted] = useState(false)
  const [noBtnPos, setNoBtnPos] = useState<{ x: number, y: number } | null>(null)

  // Ref for the placeholder where the "NO" button *should* be
  const noPlaceholderRef = useRef<HTMLDivElement>(null)

  const handleYes = () => {
    setAccepted(true)
  }

  const handleNoClick = () => {
    alert("ARE YOU SURE YOU WILL NEVER TOUCH MY MUSCLE AGAIN")
  }

  // Measure initial position for the No button so it spawns next to Yes
  useEffect(() => {
    if (noPlaceholderRef.current) {
      const rect = noPlaceholderRef.current.getBoundingClientRect()
      setNoBtnPos({ x: rect.left, y: rect.top })
    }
  }, []) // Run once on mount

  return (
    <div className={styles.container}>
      {/* Background Hearts */}
      <div className={styles.bgHeart}>
        <img src={cat5} alt="My Valentine" className={styles.floatingImg} />
      </div>
      <div className={styles.bgHeart}><img src={cat1} alt="My Valentine" className={styles.floatingImg} /></div>
      <div className={styles.bgHeart}><img src={cat2} alt="My Valentine" className={styles.floatingImg} /></div>
      <div className={styles.bgHeart}><img src={cat3} alt="My Valentine" className={styles.floatingImg} /></div>
      <div className={styles.bgHeart}><img src={cat4} alt="My Valentine" className={styles.floatingImg} /></div>



      <div className={styles.card}>
        {!accepted ? (
          <>
            <h1 className={styles.title}>Will you be my Valentine?</h1>
            <p className={styles.subtext}>
              Ill spoil u more when you come back if you accept it ;)
            </p>

            <div className={styles.buttonGroup}>
              <button className={styles.yesButton} onClick={handleYes}>
                YES
              </button>

              {/* Invisible spacer to reserve layout space same as RepelButton */}
              <div
                ref={noPlaceholderRef}
                style={{ width: '80px', height: '50px' }}
              />
            </div>
          </>
        ) : (
          <div className={styles.successContainer}>
            <div className={styles.heartEmoji}><img src={ss} alt="My Valentine" /></div>
            <h1 className={styles.title}>;D YAYYYY MWWAAH</h1>
            <p className={styles.subtext} style={{ fontSize: '1.5rem', color: '#a61e4d' }}>
              Even tho we cant meet together this year, I still love you my baby :)
            </p>


            <div className={styles.dateDetails}>
              <img src={ticket} alt="My Valentine" style={{ width: '500px' }} />
            </div>
          </div>
        )}
      </div>

      {/* Render RepelButton outside the card so 'position: fixed' relates to viewport, not the transformed card */}
      {!accepted && noBtnPos && (
        <RepelButton
          label="NO"
          onClick={handleNoClick}
          initialPos={noBtnPos}
        />
      )}
    </div>
  )
}

export default App
