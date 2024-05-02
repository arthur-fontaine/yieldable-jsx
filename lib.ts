export type Primitive = string | number | boolean | null | undefined

export type ComponentProps = {
  [key: string]: Primitive
}

export type NoProps = Record<string, never>

export interface HelperUtil {
  (cb: () => void): void
  data: <T, K extends string>(key: K, value: T) => Data<T, K>
}

export type ComponentRenderFn<P extends ComponentProps> = (props: P, _: HelperUtil) =>
  Generator<
    | WithoutNever<JSX.Element>
    | Data<any, string>
  >

export type YieldableElement = GeneratorValue<ReturnType<ComponentRenderFn<NoProps>>>

class Data<T, K extends string> {
  #onSet: () => void

  constructor(
    public key: K,
    public value: T,
    onSet: () => void
  ) {
    this.#onSet = onSet
  }

  *[Symbol.iterator]() {
    yield this
    return {
      [this.key]: this.value,
      [`set${this.key}`]: (value: T) => {
        this.value = value
        this.#onSet()
      }
    } as (
        { [_ in K]: T } &
        { [_ in `set${K}`]: (value: T) => void }
      )
  }
}

export interface Component<P extends ComponentProps = NoProps> extends ComponentRenderFn<P> { }
export class Component<P extends ComponentProps = NoProps> extends Function implements Component<P> {
  #cache: YieldableElement[] = []
  #cacheExpired = true
  #generator: ComponentRenderFn<P>
  #oldProps: P | undefined

  constructor(generator: ComponentRenderFn<P>) {
    super('console.warn("Do not call this function")')
    this.#generator = generator
  }

  *render(props: P) {
    const helper = ((cb) => {
      cb()
      this.#cacheExpired = true
    }) as HelperUtil
    helper.data = (key, value) => {
      const cachedData = this.#cache.find((e) => e instanceof Data && e.key === key) as Data<any, any> | undefined
      if (cachedData) {
        return cachedData
      }

      return new Data(key, value, () => this.#cacheExpired = true)
    }

    if (this.#cacheExpired || this.#hasPropsChanged(props)) {
      this.#cache = this.#cache.filter((element) => {
        if (element instanceof Data) {
          return true // Keep data elements
        }
        return false // Remove all other elements
      })
      for (const element of this.#generator(props, helper)) {
        if (element instanceof Data) {
          const cachedData = this.#cache.find((e) => e instanceof Data && e.key === element.key)
          if (cachedData) {
            yield cachedData
            continue
          }
        }

        this.#cache.push(element)
        yield element
      }
      this.#cacheExpired = false
      this.#oldProps = props
      return
    }

    for (const element of this.#cache) {
      yield element
    }
  }

  #hasPropsChanged(newProps: P) {
    const prevProps = this.#oldProps

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
    for (const element of component.render({})) {
      if ('nodes' in element) {
        for (const node of element.nodes) {
          root.appendChild(node)
        }
        continue
      }
    }
    setTimeout(update, 1000)
  }

  update()

  return update
}

export function* h(
  tag: string | Component,
  props: Record<string, any>,
  ...children: any[]
): Generator<YieldableElement> {
  if (typeof tag === "function") {
    for (const element of tag.render(props as any)) {
      yield element
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

  yield { nodes: [element], [Symbol.iterator]: () => {} }
  return
}

// Utils

type GeneratorValue<T extends Generator<any>> = T extends Generator<infer U> ? U : never

type WithoutNever<T> = Prettify<Omit<T, {
  [K in keyof T]: T[K] extends never ? K : never
}[keyof T]>>

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
