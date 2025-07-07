import React from 'react'

const GraphPage = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Knowledge Graph
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600">
            Your knowledge graph will appear here, showing connections between people, places, and events.
          </p>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Knowledge graph visualization will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphPage