import './illustrations.css';

/**
 * One illustrated frame: drawn SVG inside the page's own <svg>, so the motion styles reach it. The picture is
 * described by `label`; its words (speech, screens) are part of the drawing and repeated in the text beside it.
 */
export function Scene({ markup, label, className = '' }: { markup: string; label: string; className?: string }) {
  return (
    <div className={`ill ill-grain ${className}`}>
      <svg viewBox="0 0 800 450" role="img" aria-label={label} className="scene-in" dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
}
