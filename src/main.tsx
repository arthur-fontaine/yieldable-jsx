import { defineComponent, render, h } from "../lib"

const Word = defineComponent<{ word: string }>(function* ({ word }) {
  yield* <p>{word}</p>
})

const Comp = defineComponent(function* ({}, _) {
  yield* <p>hello</p>

  const { word, setword } = yield* _.data('word', 'foo')

  const changeWord = () => setword("world")
  setTimeout(changeWord, 1000)

  yield* <Word word={word} />
})

render(Comp, document.getElementById("root")!)
