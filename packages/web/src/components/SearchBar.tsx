/**
 * @fileoverview 搜索栏组件
 * @description 文件搜索功能
 */

import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchFiles, clearSearchResults, openFile } from '../store/fileSystemSlice';
import './SearchBar.css';

// ==================== 搜索结果组件 ====================

interface SearchResultItemProps {
  file: {
    path: string;
    name: string;
  };
  query: string;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ file, query, onClick }) => {
  // 高亮搜索关键字
  const highlightName = () => {
    const index = file.name.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return file.name;

    const before = file.name.substring(0, index);
    const match = file.name.substring(index, index + query.length);
    const after = file.name.substring(index + query.length);

    return (
      <>
        {before}
        <mark className="search-highlight">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <div className="search-result-item" onClick={onClick}>
      <span className="search-result-icon">📄</span>
      <span className="search-result-name">{highlightName()}</span>
      <span className="search-result-path">{file.path}</span>
    </div>
  );
};

// ==================== 搜索栏主组件 ====================

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  className = '',
  placeholder = 'Search files...',
}) => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchResults = useAppSelector(state => state.fileSystem.searchResults);
  const isLoading = useAppSelector(state => state.fileSystem.operationState.isLoading);

  // 防抖搜索
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (searchQuery.trim()) {
            setIsSearching(true);
            dispatch(searchFiles({ path: '', query: searchQuery }))
              .finally(() => setIsSearching(false));
          } else {
            dispatch(clearSearchResults());
          }
        }, 300);
      };
    })(),
    [dispatch]
  );

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // 处理清除
  const handleClear = () => {
    setQuery('');
    dispatch(clearSearchResults());
  };

  // 处理结果点击
  const handleResultClick = (file: any) => {
    dispatch(openFile(file));
    setQuery('');
    dispatch(clearSearchResults());
  };

  // 按ESC关闭搜索结果
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`search-bar ${className}`}>
      {/* 搜索输入框 */}
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Search files"
        />
        {query && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* 搜索结果 */}
      {(isSearching || isLoading || searchResults) && query && (
        <div className="search-results">
          {isSearching || isLoading ? (
            <div className="search-loading">Searching...</div>
          ) : searchResults && searchResults.count > 0 ? (
            <>
              <div className="search-results-header">
                Found {searchResults.count} {searchResults.count === 1 ? 'file' : 'files'}
              </div>
              <div className="search-results-list">
                {searchResults.files.map(file => (
                  <SearchResultItem
                    key={file.path}
                    file={file}
                    query={searchResults.query}
                    onClick={() => handleResultClick(file)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="search-no-results">No files found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
