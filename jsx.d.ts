namespace JSX {
  export interface Element {
    nodes: Node[]

    type: never
    props: never
    key: never

    [Symbol.iterator](): any
  }
}
