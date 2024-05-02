export function jsx(
  tag: string,
  props: Record<string, any>,
  ...children: any[]
) {
  return { tag, props, children }
}
export const jsxs = jsx

export const Fragment = Symbol('Fragment')
jsx.Fragment = Fragment

jsx.TextNode = 'text'
jsx.customAttributes = ['children', 'key', 'props']

export { render, render as h } from '../lib'
