import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SearchBar } from '../SearchBar';
import fileSystemReducer from '../../store/fileSystemSlice';

describe('SearchBar Component', () => {
  const createStore = (initialState = {}) =>
    configureStore({
      reducer: {
        fileSystem: fileSystemReducer,
      },
      preloadedState: {
        fileSystem: {
          currentDirectory: '',
          fileTree: null,
          expandedFolders: [],
          selectedFile: null,
          openFiles: [],
          currentFile: null,
          recentFiles: [],
          searchResults: null,
          operationState: {
            isLoading: false,
            error: null,
            lastOperation: null,
          },
          isWatching: false,
          ...initialState,
        },
      },
    });

  it('should render search input', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SearchBar />
      </Provider>
    );

    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
  });

  it('should update search query on input change', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SearchBar />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Search files...');
    fireEvent.change(input, { target: { value: 'test.md' } });
    expect(input).toHaveValue('test.md');
  });

  it('should show clear button when search query is not empty', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SearchBar />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Search files...');
    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = screen.getByLabelText('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  it('should clear search query when clicking clear button', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <SearchBar />
      </Provider>
    );

    const input = screen.getByPlaceholderText('Search files...');
    fireEvent.change(input, { target: { value: 'test' } });

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });
});
