import { splitTemplate } from '../utils/homeNext';

/** A template string with {{key}} slots rendered with each value isolated (<bdi>, direction from its own
 *  text: an English name or a number reads LTR, a Hebrew name or step label RTL), so it keeps its place
 *  inside Hebrew text. */
export default function Slots({ text, vals }) {
  const parts = splitTemplate(text, Object.keys(vals));
  return parts.map((p, i) => (p.key ? <bdi key={i}>{vals[p.key]}</bdi> : <span key={i}>{p.text}</span>));
}
