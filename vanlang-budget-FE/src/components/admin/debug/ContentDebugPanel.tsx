'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ContentDebugPanelProps {
    currentLanguage: 'vi' | 'en';
    fullContent: any;
    currentLangContent: any;
    selectedPage: string;
    isLoading: boolean;
    hasChanges: boolean;
    onRefresh?: () => void;
}

export default function ContentDebugPanel({
    currentLanguage,
    fullContent,
    currentLangContent,
    selectedPage,
    isLoading,
    hasChanges,
    onRefresh
}: ContentDebugPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullContent, setShowFullContent] = useState(false);
    const [showCurrentContent, setShowCurrentContent] = useState(true);

    // Only show in development
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    const formatJSON = (obj: any) => {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            return 'Error formatting JSON: ' + error;
        }
    };

    const getContentStats = () => {
        const stats = {
            fullContentKeys: fullContent ? Object.keys(fullContent) : [],
            currentContentKeys: currentLangContent ? Object.keys(currentLangContent) : [],
            hasViContent: fullContent?.vi ? true : false,
            hasEnContent: fullContent?.en ? true : false,
            currentLangHasContent: currentLangContent && Object.keys(currentLangContent).length > 0
        };
        return stats;
    };

    const stats = getContentStats();

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-gray-900 text-white rounded-lg shadow-lg max-w-md">
            {/* Header */}
            <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 rounded-t-lg"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center space-x-2">
                    <Bug className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">Content Debug</span>
                    <div className="flex items-center space-x-1">
                        {isLoading && (
                            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                        )}
                        {hasChanges && (
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                ) : (
                    <ChevronDown className="h-4 w-4" />
                )}
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-3 border-t border-gray-700 max-h-96 overflow-y-auto">
                    {/* Quick Stats */}
                    <div className="mb-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-gray-400">Page:</span>
                                <span className="ml-1 text-blue-300">{selectedPage}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Lang:</span>
                                <span className="ml-1 text-green-300">{currentLanguage}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">VI:</span>
                                <span className={`ml-1 ${stats.hasViContent ? 'text-green-300' : 'text-red-300'}`}>
                                    {stats.hasViContent ? '✓' : '✗'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">EN:</span>
                                <span className={`ml-1 ${stats.hasEnContent ? 'text-green-300' : 'text-red-300'}`}>
                                    {stats.hasEnContent ? '✓' : '✗'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 mb-3">
                        <button
                            onClick={onRefresh}
                            className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        >
                            <RefreshCw className="h-3 w-3" />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => setShowFullContent(!showFullContent)}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                        >
                            {showFullContent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>Full</span>
                        </button>
                        <button
                            onClick={() => setShowCurrentContent(!showCurrentContent)}
                            className="flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                        >
                            {showCurrentContent ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            <span>Current</span>
                        </button>
                    </div>

                    {/* Content Display */}
                    <div className="space-y-3">
                        {/* Full Content */}
                        {showFullContent && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-300 mb-1">
                                    Full Content ({stats.fullContentKeys.length} keys)
                                </h4>
                                <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto max-h-32">
                                    {formatJSON(fullContent)}
                                </pre>
                            </div>
                        )}

                        {/* Current Language Content */}
                        {showCurrentContent && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-300 mb-1">
                                    Current Lang Content ({stats.currentContentKeys.length} keys)
                                </h4>
                                <pre className="text-xs bg-gray-800 p-2 rounded overflow-x-auto max-h-32">
                                    {formatJSON(currentLangContent)}
                                </pre>
                            </div>
                        )}

                        {/* Content Keys Comparison */}
                        <div>
                            <h4 className="text-xs font-medium text-gray-300 mb-1">Content Keys</h4>
                            <div className="text-xs space-y-1">
                                <div>
                                    <span className="text-gray-400">Full:</span>
                                    <span className="ml-1 text-blue-300">
                                        [{stats.fullContentKeys.join(', ')}]
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Current:</span>
                                    <span className="ml-1 text-green-300">
                                        [{stats.currentContentKeys.join(', ')}]
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="pt-2 border-t border-gray-700">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">Status:</span>
                                <div className="flex items-center space-x-2">
                                    {isLoading && (
                                        <span className="text-blue-300">Loading...</span>
                                    )}
                                    {hasChanges && (
                                        <span className="text-orange-300">Unsaved</span>
                                    )}
                                    {!isLoading && !hasChanges && (
                                        <span className="text-green-300">Synced</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
