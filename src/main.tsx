import { defineComponent, render, h } from "../lib"

const Word = defineComponent<{ word: string }>(function* ({ word }) {
  console.log("rendering Word")

  yield* <p>{word}</p>
})

let word = "world"
const Comp = defineComponent(function* ({}, _) {
  console.log("rendering Comp")

  yield* <p>hello</p>

  const changeWord = () => _(() => {
    word = "foo"
  })
  setTimeout(changeWord, 1000)

  yield* <Word word={word} />
})

render(Comp, document.getElementById("root")!)
