import '@testing-library/jest-dom'

import { useList } from '@refinedev/core'
import { fireEvent, render, screen } from '@testing-library/react'

import { FlowShow } from './Show'

jest.mock('@refinedev/core', () => ({
  useList: jest.fn(),
}))

jest.mock('lodash/debounce', () => ({
  default: jest.fn((fn) => {
    const debouncedFn = () => fn()
    debouncedFn.cancel = jest.fn()
    return debouncedFn
  }),
  __esModule: true,
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('FlowShow', () => {
  test('Alert banner shown in case of empty data actions', () => {
    const mockData = {
      data: {
        data: [],
      },
    }
    ;(useList as jest.Mock).mockReturnValue(mockData)
    render(<FlowShow />)
    expect(screen.getByText('No data actions')).toBeInTheDocument()
  })

  test('Alert banner shown if duplicated actions in the data', () => {
    const mockData = {
      data: {
        data: [
          { id: 'test:deploy', title: 'Deploy' },
          { id: 'test:deploy', title: 'Deploy duplicated' },
          { id: 'test.subtest:build', title: 'Build' },
        ],
      },
    }
    ;(useList as jest.Mock).mockReturnValue(mockData)
    render(<FlowShow />)
    expect(
      screen.getByText('Duplicated IDs of actions detected')
    ).toBeInTheDocument()
  })

  // Initially we have all actions available in second tab 'Actions' in the left sidebar.
  test('All actions are rendered somehow in the component if good data', () => {
    const mockData = {
      data: {
        data: [
          { id: 'test:deploy', title: 'Deploy' },
          { id: 'test.subtest:build', title: 'Build' },
        ],
      },
    }
    ;(useList as jest.Mock).mockReturnValue(mockData)
    const { container } = render(<FlowShow />)
    const sidebarTabs = container.querySelector('.sidebar-flow-tabs')
    expect(sidebarTabs).toBeInTheDocument()
    const buttons = sidebarTabs?.querySelectorAll('button')
    expect(buttons?.length).toBeGreaterThanOrEqual(2)
    if (buttons && buttons[1]) fireEvent.click(buttons[1])
    const resultElement = container.querySelector('.list-of-actions')
    expect(resultElement).toBeInTheDocument()
    expect(resultElement).toHaveTextContent('test:deploy')
    expect(resultElement).toHaveTextContent('test.subtest:build')
  })
})
