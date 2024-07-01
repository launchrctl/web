import Ansi from 'ansi-to-react'
import { FC } from 'react'

interface ITerminalProps {
  text: string
}

const TerminalBox: FC<ITerminalProps> = ({ text }) => {
  return <Ansi>{text}</Ansi>
}

export default TerminalBox
