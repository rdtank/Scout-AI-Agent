import { Fragment } from "react";

function parseInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return <em key={i}>{tok.slice(1, -1)}</em>;
    }
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    return tok;
  });
}

function Markdown({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let key = 0;

  const blocks = text.split(/\n{2,}/);

  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (!lines.length) continue;

    const first = lines[0];

    const hMatch = first.match(/^(#{1,3})\s+(.*)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const content = parseInline(hMatch[2]);
      if (level === 1) nodes.push(<h1 key={key++}>{content}</h1>);
      else if (level === 2) nodes.push(<h2 key={key++}>{content}</h2>);
      else nodes.push(<h3 key={key++}>{content}</h3>);
      if (lines.length > 1) {
        nodes.push(<p key={key++}>{parseInline(lines.slice(1).join(" "))}</p>);
      }
      continue;
    }

    const isBullet = lines.every((l) => /^[-*]\s/.test(l));
    if (isBullet) {
      nodes.push(
        <ul key={key++}>
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.replace(/^[-*]\s/, ""))}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const isNumbered = lines.every((l) => /^\d+\.\s/.test(l));
    if (isNumbered) {
      nodes.push(
        <ol key={key++}>
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.replace(/^\d+\.\s/, ""))}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Mixed block — render line by line
    const lineNodes: React.ReactNode[] = [];
    let bulletBuf: string[] = [];

    const flushBullets = () => {
      if (!bulletBuf.length) return;
      lineNodes.push(
        <ul key={lineNodes.length}>
          {bulletBuf.map((b, i) => (
            <li key={i}>{parseInline(b)}</li>
          ))}
        </ul>,
      );
      bulletBuf = [];
    };

    for (const line of lines) {
      if (/^[-*]\s/.test(line)) {
        bulletBuf.push(line.replace(/^[-*]\s/, ""));
      } else if (/^\d+\.\s/.test(line)) {
        flushBullets();
        lineNodes.push(<p key={lineNodes.length}>{parseInline(line.replace(/^\d+\.\s/, ""))}</p>);
      } else {
        flushBullets();
        if (line.trim()) {
          lineNodes.push(<p key={lineNodes.length}>{parseInline(line)}</p>);
        }
      }
    }
    flushBullets();

    nodes.push(<Fragment key={key++}>{lineNodes}</Fragment>);
  }

  return <>{nodes}</>;
}

interface Props {
  text: string;
}

export function Answer({ text }: Props) {
  return (
    <div className="scout-answer">
      <div className="answer-heading">
        <span className="answer-dot" />
        <span className="answer-label">Answer</span>
      </div>
      <div className="answer-body">
        <Markdown text={text} />
      </div>
    </div>
  );
}
