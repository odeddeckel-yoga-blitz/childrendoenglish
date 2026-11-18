import { describe, it, expect } from 'vitest';
import { installDomTranslateGuard, pageTranslated } from '../utils/domTranslateGuard';

// Each test patches a fresh prototype copy so jsdom's real Node stays untouched.
function freshProto() {
  const proto = Object.create(Node.prototype);
  proto.removeChild = Node.prototype.removeChild;
  proto.insertBefore = Node.prototype.insertBefore;
  return proto;
}

describe('domTranslateGuard', () => {
  it('turns a translated-away reference node into a no-op instead of NotFoundError', () => {
    const proto = freshProto();
    const parent = document.createElement('div');
    const text = document.createTextNode('cat');
    parent.appendChild(text);
    // what Chrome Translate does: replace the text node with a <font> wrapper
    const font = document.createElement('font');
    parent.replaceChild(font, text);
    const fresh = document.createElement('span');
    expect(() => proto.insertBefore.call(parent, fresh, text)).toThrow();
    installDomTranslateGuard(proto);
    expect(() => proto.insertBefore.call(parent, fresh, text)).not.toThrow();
    expect(() => proto.removeChild.call(parent, text)).not.toThrow();
  });

  it('leaves correct calls working', () => {
    const proto = freshProto();
    installDomTranslateGuard(proto);
    const parent = document.createElement('div');
    const a = document.createElement('b');
    parent.appendChild(a);
    const n = document.createElement('i');
    proto.insertBefore.call(parent, n, a);
    expect(parent.firstChild).toBe(n);
    proto.removeChild.call(parent, a);
    expect(parent.childNodes.length).toBe(1);
    expect(installDomTranslateGuard(proto)).toBe(false); // installs once
  });

  it('reads the translated marker on <html>', () => {
    expect(pageTranslated({ documentElement: { className: 'translated-rtl' } })).toBe('yes');
    expect(pageTranslated({ documentElement: { className: '' } })).toBe('no');
  });
});
