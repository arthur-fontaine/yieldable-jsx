import { defineComponent, render, h } from '../lib'

const Word = defineComponent<{ word: string }>(function* ({ word }) {
  yield* <span>{word}</span>
})

const Comp = defineComponent(function* ({}, _) {
  const closeP = yield* _.openTag('p', {})

  yield* <span>hello{' '}</span>

  const { word, setword } = yield* _.state('word', 'foo')

  const changeWord = () => setword('world')
  setTimeout(changeWord, 2000)

  yield* <Word word={word} />

  yield* closeP()

  yield* <span>goodbye{' '}</span>
})

render(Comp, document.getElementById('root')!)
