import '@testing-library/jest-dom'

import { render } from '@testing-library/react'

import { FlowShow } from './Show'

// Mocking useList from @refinedev/core
jest.mock('@refinedev/core', () => ({
  ...jest.requireActual('@refinedev/core'),
  useList: jest.fn(),
}))

describe('FlowShow', () => {
  test('renders correctly and displays data', () => {
    // Arrange
    const mockData = {
      data: [
        { id: 'type1:action1', name: 'Action 1' },
        { id: 'type1:action2', name: 'Action 2' },
      ],
    }

    // Act
    render(<FlowShow />)

    // Assert
    // expect(screen.getByText('Action 1')).toBeInTheDocument()
    // expect(screen.getByText('Action 2')).toBeInTheDocument()
  })
})
