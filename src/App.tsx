import { useState } from "react";

const SIZE = 5;

export default function App() {

  const [board, setBoard] = useState(
    Array(SIZE).fill().map(() =>
      Array(SIZE).fill({ player: 0, power: 0 })
    )
  );

  const [turn, setTurn] = useState("Red");

  function handleClick(r, c) {
    const newBoard = board.map(row => row.map(cell => ({...cell})));

    newBoard[r][c].player = turn === "Red" ? 1 : 2;
    newBoard[r][c].power += 1;

    setBoard(newBoard);
    setTurn(turn === "Red" ? "Blue" : "Red");
  }

  function getColor(cell){
    if(cell.player === 1) return "#ff4d4d";
    if(cell.player === 2) return "#4da6ff";
    return "#222";
  }

  return (
    <div style={{
      background:"#0f172a",
      color:"white",
      height:"100vh",
      padding:"20px",
      fontFamily:"sans-serif"
    }}>

      <h1 style={{textAlign:"center"}}>Color War Arena</h1>

      {/* Score Panel */}
      <div style={{
        display:"flex",
        justifyContent:"space-between",
        marginBottom:"20px"
      }}>
        <div>🔴 Red AI</div>
        <div>🔵 Blue AI</div>
      </div>

      {/* Board */}
      <div style={{
        display:"grid",
        gridTemplateColumns:`repeat(${SIZE},80px)`,
        justifyContent:"center",
        gap:"10px"
      }}>

        {board.map((row,r)=>
          row.map((cell,c)=>

            <div
              key={`${r}-${c}`}
              onClick={()=>handleClick(r,c)}
              style={{
                width:80,
                height:80,
                borderRadius:"12px",
                background:getColor(cell),
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                fontSize:"20px",
                cursor:"pointer",
                boxShadow:
                  cell.player === 1
                    ? "0 0 15px #ff4d4d"
                    : cell.player === 2
                    ? "0 0 15px #4da6ff"
                    : "none"
              }}
            >
              {cell.power > 0 ? cell.power : ""}
            </div>

          )
        )}

      </div>

      {/* Info Panel */}
      <div style={{marginTop:"20px", textAlign:"center"}}>
        <p>Turn: {turn} AI</p>
        <p>Status: Running</p>
      </div>

      {/* Controls */}
      <div style={{
        display:"flex",
        justifyContent:"center",
        gap:"10px",
        marginTop:"10px"
      }}>
        <button>Start</button>
        <button>Pause</button>
        <button>Next Step</button>
      </div>

    </div>
  );
}