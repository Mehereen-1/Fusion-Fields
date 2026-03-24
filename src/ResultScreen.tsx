import { Player, Scores } from "./types";

interface ResultScreenProps {
  winner: Player;
  scores: Scores;
  onPlayAgain: () => void;
  onBackHome: () => void;
}

function winnerLabel(winner: Player): string {
  if (winner === 1) {
    return "Red Player Wins";
  }
  if (winner === 2) {
    return "Blue Fuzzy AI Wins";
  }
  return "Draw";
}

export default function ResultScreen({ winner, scores, onPlayAgain, onBackHome }: ResultScreenProps) {
  return (
    <section className="result-screen">
      <div className="result-screen__bg" />
      <div className="result-panel glass-panel">
        <p className="eyebrow">Match Complete</p>
        <h2 className={winner === 1 ? "winner-red" : winner === 2 ? "winner-blue" : "winner-draw"}>
          {winnerLabel(winner)}
        </h2>

        <div className="result-score">
          <p>Red Power: {scores.redPower}</p>
          <p>Blue Power: {scores.bluePower}</p>
          <p>Red Cells: {scores.redCells}</p>
          <p>Blue Cells: {scores.blueCells}</p>
        </div>

        <div className="result-actions">
          <button className="btn btn-primary" onClick={onPlayAgain} type="button">
            Play Again
          </button>
          <button className="btn btn-ghost" onClick={onBackHome} type="button">
            Back to Home
          </button>
        </div>
      </div>
    </section>
  );
}
