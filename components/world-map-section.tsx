"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, TrendingDown, BarChart3, Building, Thermometer, Package, Zap, HardHat, Droplets, TrendingUp, Activity } from "lucide-react"
import { fetchDriversData, DriverData } from "@/lib/drivers-data"

// Icon mapping based on category
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('housing') || categoryLower.includes('construction')) return <Building className="h-full w-full text-gray-500" />
  if (categoryLower.includes('climate') || categoryLower.includes('weather')) return <Thermometer className="h-full w-full text-gray-500" />
  if (categoryLower.includes('supply') || categoryLower.includes('trade')) return <Package className="h-full w-full text-gray-500" />
  if (categoryLower.includes('energy') || categoryLower.includes('power')) return <Zap className="h-full w-full text-gray-500" />
  if (categoryLower.includes('labour') || categoryLower.includes('employment')) return <HardHat className="h-full w-full text-gray-500" />
  if (categoryLower.includes('volume') || categoryLower.includes('production')) return <Activity className="h-full w-full text-gray-500" />
  if (categoryLower.includes('price') || categoryLower.includes('inflation')) return <TrendingUp className="h-full w-full text-gray-500" />
  return <BarChart3 className="h-full w-full text-gray-500" />
}

export function WorldMapSection() {
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDrivers = async () => {
      const driversData = await fetchDriversData()
      setDrivers(driversData)
      setLoading(false)
      // Set the first driver as selected by default
      if (driversData.length > 0) {
        setSelectedDriver(driversData[0])
      }
    }
    
    loadDrivers()
  }, [])

  const handleDriverClick = (driver: DriverData) => {
    setSelectedDriver(driver)
  }

  if (loading) {
    return (
      <div className="w-full flex gap-4">
        <Card className="flex-1 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading drivers data...</p>
          </div>
        </Card>
        <Card className="w-80 h-[500px] md:h-[600px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Select a driver to view details</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full flex gap-4">
      {/* Map Card - Left Side (2/3 width) */}
      <Card className="flex-1 h-[500px] md:h-[600px] overflow-hidden">
        <div className="relative w-full h-full">
          <img 
            src="/map.svg" 
            alt="World Map" 
            className="w-full h-full object-cover opacity-80"
          />
          
          {/* Driver Icons */}
          {drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => handleDriverClick(driver)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                selectedDriver?.id === driver.id
                  ? 'border-blue-500 bg-blue-100 shadow-lg' 
                  : 'border-gray-400 bg-gray-100 hover:border-gray-500'
              }`}
              style={{
                left: `${driver.coordinates.x}%`,
                top: `${driver.coordinates.y}%`
              }}
              title={`${driver.name} (${driver.category})`}
            >
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-3 h-3 md:w-4 md:h-4">
                  {getCategoryIcon(driver.category)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Drivers Card - Right Side (1/3 width) */}
      <Card className="w-80 h-[500px] md:h-[600px] overflow-y-auto">
        <CardHeader className="pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Expert Drivers</h3>
          <p className="text-sm text-gray-600">{drivers.length} drivers available</p>
        </CardHeader>
        
        <CardContent className="p-4">
          {selectedDriver ? (
            <div className="space-y-4">
              {/* Driver Header */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-5 h-5">
                    {getCategoryIcon(selectedDriver.category)}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{selectedDriver.name}</h4>
                  <p className="text-xs text-gray-600">{selectedDriver.region.join(' > ')}</p>
                  <p className="text-xs text-blue-600">{selectedDriver.category}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{selectedDriver.importance.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Importance Score</div>
              </div>

              {/* Direction Indicator */}
              <div className={`rounded-lg p-3 ${
                selectedDriver.direction > 0 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedDriver.direction > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-700" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-700" />
                  )}
                  <span className={`text-sm font-medium ${
                    selectedDriver.direction > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedDriver.direction > 0 ? 'Positive' : 'Negative'} Impact
                  </span>
                </div>
              </div>

              {/* Lag Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Lag:</span> {selectedDriver.lag}
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Chart visualization</p>
                  <p className="text-xs">Driver: {selectedDriver.id}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                This driver shows {selectedDriver.direction > 0 ? 'positive' : 'negative'} correlation 
                with the target variable, with an importance score of {selectedDriver.importance.toFixed(1)}% 
                and a lag of {selectedDriver.lag}.
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Select a driver from the map to view details</p>
              <p className="text-xs mt-2">Click on any icon to explore driver data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
