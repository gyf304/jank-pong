import React from "react";
import style from "./Pong.module.css";

const mouseSpeed = 0.0015;
const paddleSize = 0.15;
const vyRange = 0.0015;
const vel = 0.0012;
const velMult = 1.1;
const maxVel = 0.005;

interface PongDispState {
    lScore: number;
    rScore: number;
    l: number;
    r: number;
    x: number;
    y: number;
}

const clamp = (x: number, min: number, max: number) => (Math.max(min, Math.min(max, x)))

const audioCtx = new window.AudioContext();

const beep = (freq: number, ms: number) => {
    const osc = audioCtx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(audioCtx.destination);
    setTimeout(() => {
        osc.stop();
        osc.disconnect();
    }, ms);
    osc.start();
};

const PongDisp = (s: PongDispState) => (
    <div className={style.pongApp}>
        <div className={style.scoreL}>{s.lScore}</div>
        <div className={style.scoreR}>{s.rScore}</div>
        <div className={style.centerLine} />
        <div className={style.arena}>
            <div style={{left: `${s.x*50+50}%`, top: `${s.y*50+50}%`}} className={style.ball} />
            <div style={{height: `calc(${paddleSize*100}% - 1em)`, top: `${s.l*50+50}%`}} className={style.paddleL} />
            <div style={{height: `calc(${paddleSize*100}% - 1em)`, top: `${s.r*50+50}%`}} className={style.paddleR} />
        </div>
    </div>
);

const Pong = React.memo(() => {
    let [state, setState] = React.useState({
        lScore: 0,
        rScore: 0,
        l: 0,
        r: 0,
        x: 0,
        y: 0
    });

    let gameDivRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (gameDivRef.current == null) {
            return;
        }

        let lScore = 0;
        let rScore = 0;
        let l = 0;
        let r = 0;
        let x = 0;
        let y = 0;

        let done = false;
        let accX = 0;
        let accY = 0;
        let vx = vel;
        let vy = 0.00;
        let sleep = 5000;
        let prevTime = window.performance.now();
        let collision = true;
        let frameCallback = (time: number) => {
            if (done) {
                return;
            }
            let timeDelta = time - prevTime;
            prevTime = time;

            l = clamp(l + accX * mouseSpeed, -1.0+paddleSize, 1.0-paddleSize);
            r = clamp(r + accY * mouseSpeed, -1.0+paddleSize, 1.0-paddleSize);

            accX = 0;
            accY = 0;

            if (sleep > 0) {
                sleep -= timeDelta;
            } else {
                if ((y > 1 && vy > 0) || (y < -1 && vy < 0)) {
                    // hit on side walls
                    vy = -vy;
                    beep(220, 50);
                }
                x = x + vx * timeDelta;
                y = y + vy * timeDelta;
                if (collision && ((x > 1 && vx > 0) || (x < -1 && vx < 0))) {
                    // collision check
                    let deviation = (y - (x > 0 ? r : l)) / paddleSize;
                    if (Math.abs(deviation) < 1) { // hit
                        vx = - clamp(vx * velMult, -maxVel, maxVel);
                        vy = deviation * vyRange;
                        x = clamp(x, -1, 1);
                        beep(440, 50);
                    } else {
                        collision = false;
                    }
                }
                if (Math.abs(x) > 1.4 && !collision) {
                    // out of bounds
                    if (x > 0) {
                        lScore += 1;
                    } else {
                        rScore += 1;
                    }
                    sleep = 1000;
                    vy = -vy;
                    vx = Math.sign(vx) * vel;
                    collision = true;
                    x = 0;
                    // scare players
                    beep(110, 500);
                }
            }
            setState({lScore, rScore, l, r, x, y});
            window.requestAnimationFrame(frameCallback);
        };
        window.requestAnimationFrame(frameCallback);

        let mouseHandler = (event: MouseEvent) => {
            accX += event.movementX;
            accY += event.movementY;
        };
        let gameDiv = gameDivRef.current;
        gameDiv.addEventListener("mousemove", mouseHandler);
        return () => {
            done = true;
            gameDiv.removeEventListener("mousemove", mouseHandler);
        }
    }, [gameDivRef]);

    return <div ref={gameDivRef} onClick={() => {
        gameDivRef.current!.requestPointerLock();
        audioCtx.resume();
    }}>
        <PongDisp {...state} />
    </div>
});

export default Pong;
