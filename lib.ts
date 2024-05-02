export type Primitive = string | number | boolean | null | undefined

export type ComponentProps = {
  [key: string]: Primitive
}

export type NoProps = Record<string, never>

export interface HelperUtil {
  (cb: () => void): void
}

export type ComponentRenderFn<P extends ComponentProps> = (props: P, _: HelperUtil) => Generator<JSX.Element>

export interface Component<P extends ComponentProps = NoProps> extends ComponentRenderFn<P> {
}

export class Component<P extends ComponentProps = NoProps> extends Function implements Component<P> {
  #render: ComponentRenderFn<P>
  #currentProps?: P

  cache: JSX.Element[] | undefined = undefined

  constructor(render: ComponentRenderFn<P>) {
    super('return this.render(...arguments)')
    this.#render = render
  }

  *render(props: P) {
    if (this.cache !== undefined && !this.shouldComponentUpdate(props)) {
      for (const element of this.cache) {
        yield element
      }
      return
    }

    this.#currentProps = props
    this.cache = []
    for (const element of this.#render(
      props,
      (cb) => { cb(); this.#resetCache() }
    )) {
      this.cache.push(element)
      yield element
    }
  }

  #resetCache = () => {
    this.cache = undefined
  }

  shouldComponentUpdate(newProps: P): boolean {
    const prevProps = this.#currentProps

    if (!prevProps) {
      return true
    }

    // Check if the props have changed
    for (const key in newProps) {
      if (newProps[key] !== prevProps[key]) {
        return true
      }
    }

    // Check if the props have been removed
    for (const key in prevProps) {
      if (!(key in newProps)) {
        return true
      }
    }

    return false
  }
}

export const defineComponent = <P extends ComponentProps = NoProps>(fn: ComponentRenderFn<P>) => {
  return new Component(fn)
}

export const render = (component: Component, container: Element) => {
  const root = document.createElement("div")
  container.appendChild(root)

  const update = async () => {
    root.innerHTML = ""

    for (const element of h(component, {})) {
      for (const node of element.nodes) {
        root.appendChild(node)
      }
    }

    setTimeout(update, 0)
  }

  update()
  return update
}

export function* h(
  tag: string | Component,
  props: Record<string, any>,
  ...children: any[]
): Generator<WithoutNever<JSX.Element>> {
  if (typeof tag === "function") {
      for (const element of tag.render(props as any)) {
        for (const node of element.nodes) {
          yield { nodes: [node] }
        }
    }
    return
  }

  const element = document.createElement(tag)

  for (const key in props) {
    if (key === "style") {
      const style = props.style
      for (const styleKey in style) {
        element.style[styleKey as any] = style[styleKey]
      }
    } else {
      element.setAttribute(key, props[key])
    }
  }

  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child))
    } else {
      element.appendChild(child)
    }
  }

  yield { nodes: [element] }
  return
}

type WithoutNever<T> = Omit<T, {
  [K in keyof T]: T[K] extends never ? K : never
}[keyof T]>
