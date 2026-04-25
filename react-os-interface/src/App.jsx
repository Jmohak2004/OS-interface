import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const ICONS = [
  { id: 'about', label: 'About Me', icon: '👤' },
  { id: 'projects', label: 'Projects', icon: '📁' },
  { id: 'skills', label: 'Skills', icon: '⚡' },
  { id: 'paint', label: 'Paint', icon: '🎨' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'contact', label: 'Contact', icon: '📧' }
];

function App() {
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [zIndexCounter, setZIndexCounter] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenWindow = (id) => {
    if (!openWindows.find(w => w.id === id)) {
      setOpenWindows([...openWindows, { id, minimized: false, maximized: false, zIndex: zIndexCounter, pos: { x: 50 + (openWindows.length * 20), y: 50 + (openWindows.length * 20) } }]);
    }
    setActiveWindow(id);
    setZIndexCounter(prev => prev + 1);
    setStartMenuOpen(false);
    
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: zIndexCounter } : w));
  };

  const handleCloseWindow = (id) => {
    setOpenWindows(openWindows.filter(w => w.id !== id));
    if (activeWindow === id) setActiveWindow(null);
  };

  const handleMinimizeWindow = (id) => {
    setOpenWindows(openWindows.map(w => w.id === id ? { ...w, minimized: true } : w));
    setActiveWindow(null);
  };

  const handleMaximizeWindow = (id) => {
    setOpenWindows(openWindows.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  };

  const focusWindow = (id) => {
    setActiveWindow(id);
    setZIndexCounter(prev => prev + 1);
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: zIndexCounter } : w));
  };

  const updateWindowPos = (id, pos) => {
      setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, pos } : w));
  };

  return (
    <div className="desktop">
      {/* Desktop Icons */}
      {ICONS.map((icon, index) => (
        <div
          key={icon.id}
          className={`icon icon-${icon.id}`}
          onDoubleClick={() => handleOpenWindow(icon.id)}
        >
          <img src={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' fill='%23fff' opacity='0.2'/><text x='24' y='28' text-anchor='middle' fill='%23fff' font-size='12'>${icon.icon}</text></svg>`} alt={icon.label} />
          <div>{icon.label}</div>
        </div>
      ))}

      {/* Windows */}
      {openWindows.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          winState={win}
          isActive={activeWindow === win.id}
          onClose={() => handleCloseWindow(win.id)}
          onMinimize={() => handleMinimizeWindow(win.id)}
          onMaximize={() => handleMaximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          updatePos={updateWindowPos}
        />
      ))}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="start-button" onClick={() => setStartMenuOpen(!startMenuOpen)}>
          Start
        </button>
        {startMenuOpen && (
          <div className="start-menu open">
            <ul>
              {ICONS.map(icon => (
                <li key={icon.id} onClick={() => handleOpenWindow(icon.id)}>{icon.label}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="taskbar-apps">
          {openWindows.map(win => (
             <div
               key={`taskbar-${win.id}`}
               className={`app-button ${activeWindow === win.id ? 'active' : ''}`}
               onClick={() => focusWindow(win.id)}
             >
               {win.id.charAt(0).toUpperCase() + win.id.slice(1)}
             </div>
          ))}
        </div>
        <div className="clock">{time}</div>
      </div>
    </div>
  );
}

// Window Component Header Drag handling
const WindowTitleBar = ({ title, onClose, onMinimize, onMaximize, onFocus, updatePos, winState }) => {
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
  
    const handleMouseDown = (e) => {
      isDragging.current = true;
      onFocus();
      dragOffset.current = {
         x: e.clientX - winState.pos.x,
         y: e.clientY - winState.pos.y
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  
    const handleMouseMove = (e) => {
      if (isDragging.current && !winState.maximized) {
        updatePos(winState.id, {
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
      }
    };
  
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="window-titlebar" onMouseDown={handleMouseDown}>
            <span>{title}</span>
            <div className="window-titlebar-controls" onMouseDown={(e) => e.stopPropagation()}>
                <button className="control-btn" onClick={onMinimize}>−</button>
                <button className="control-btn" onClick={onMaximize}>□</button>
                <button className="control-btn close-btn" onClick={onClose}>×</button>
            </div>
        </div>
    );
};

// Main Window Component
const Window = ({ id, winState, isActive, onClose, onMinimize, onMaximize, onFocus, updatePos }) => {
  const getStyle = () => {
    if (winState.minimized) {
        return { display: 'none' };
    }
    if (winState.maximized) {
        return {
            left: 0, top: 0, width: '100vw', height: 'calc(100vh - 40px)', zIndex: winState.zIndex
        };
    }
    return {
        left: winState.pos.x + 'px',
        top: winState.pos.y + 'px',
        zIndex: winState.zIndex,
    };
  };

  const title = id.charAt(0).toUpperCase() + id.slice(1);

  return (
    <div
      className={`window active`}
      style={getStyle()}
      onMouseDown={onFocus}
    >
      <WindowTitleBar
        title={title}
        onClose={onClose}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onFocus={onFocus}
        updatePos={updatePos}
        winState={winState}
      />
      <div className="window-content">
        <WindowContent id={id} />
      </div>
    </div>
  );
};

// Generic content dispatcher
const WindowContent = ({ id }) => {
  switch (id) {
    case 'about': return <AboutContent />;
    case 'projects': return <ProjectsContent />;
    case 'skills': return <SkillsContent />;
    case 'contact': return <ContactContent />;
    case 'paint': return <PaintContent />;
    case 'games': return <GamesContent />;
    case 'camera': return <CameraContent />;
    default: return <div>Unknown Window</div>;
  }
};

const AboutContent = () => (
    <>
        <h2>John Doe</h2>
        <p>Full-Stack Developer passionate about creating innovative web experiences. With 5+ years in the industry, I specialize in HTML, CSS, JS, and more.</p>
        <ul>
            <li>Experience: 5 years</li>
            <li>Location: San Francisco</li>
            <li>Email: john@example.com</li>
        </ul>
    </>
);

const ProjectsContent = () => (
    <>
        <h2>My Projects</h2>
        <ul>
            <li><strong>Project 1:</strong> A responsive e-commerce site built with React.</li>
            <li><strong>Project 2:</strong> OS-like portfolio (this one!) using React.</li>
            <li><strong>Project 3:</strong> Data visualization dashboard with D3.js.</li>
        </ul>
        <p>View on GitHub: <a href="#" style={{color: '#00ff00'}}>github.com/johndoe</a></p>
    </>
);

const SkillsContent = () => (
    <>
        <h2>Technical Skills</h2>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <tbody>
                <tr><td>HTML/CSS</td><td>Expert</td></tr>
                <tr><td>JavaScript</td><td>Advanced</td></tr>
                <tr><td>React</td><td>Intermediate</td></tr>
                <tr><td>Node.js</td><td>Intermediate</td></tr>
                <tr><td>Python</td><td>Basic</td></tr>
            </tbody>
        </table>
    </>
);

const ContactContent = () => (
    <>
        <h2>Get in Touch</h2>
        <p>Let's collaborate! Reach out via:</p>
        <ul>
            <li>Email: <a href="mailto:john@example.com" style={{color: '#00ff00'}}>john@example.com</a></li>
            <li>LinkedIn: <a href="#" style={{color: '#00ff00'}}>linkedin.com/in/johndoe</a></li>
            <li>Phone: (123) 456-7890</li>
        </ul>
    </>
);

const PaintContent = () => {
    const canvasRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        isDrawing.current = true;
        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        lastPos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    };

    const handleMouseUpOrOut = () => {
        isDrawing.current = false;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div>
            <h2>Paint</h2>
            <canvas
                ref={canvasRef}
                id="paint-canvas"
                width="280"
                height="200"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrOut}
                onMouseOut={handleMouseUpOrOut}
            />
            <br />
            <button onClick={clearCanvas}>Clear</button>
            <label>Color: <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        </div>
    );
};

const GamesContent = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [player, setPlayer] = useState('X');
    const [winner, setWinner] = useState(null);

    const checkWinner = (squares) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    };

    const handleClick = (i) => {
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = player;
        setBoard(newBoard);
        
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
        } else {
            setPlayer(player === 'X' ? 'O' : 'X');
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setPlayer('X');
        setWinner(null);
    };

    return (
        <div>
            <h2>Tic-Tac-Toe</h2>
            <div className="tic-tac-toe">
                {board.map((cell, i) => (
                    <div key={i} className="tic-cell" onClick={() => handleClick(i)}>
                        {cell}
                    </div>
                ))}
            </div>
            <p>
                {winner ? `Player ${winner} wins!` : `Player ${player}'s turn`}
            </p>
            <button onClick={resetGame}>New Game</button>
        </div>
    );
};

const CameraContent = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    
    const startCamera = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
            }
        } catch (err) {
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stream]);

    return (
        <div>
            <h2>Camera App</h2>
            <video ref={videoRef} id="camera-video" autoPlay playsInline></video>
            <br />
            <button onClick={startCamera}>Start Camera</button>
            <button onClick={stopCamera}>Stop Camera</button>
            <p>(Grant permission for webcam access)</p>
        </div>
    );
};

export default App;
