interface Props {
  text: string;
}

export function Answer({ text }: Props) {
  return (
    <div className="scout-answer">
      <div className="answer-heading">Answer</div>
      <pre className="answer-body">{text}</pre>
    </div>
  );
}
