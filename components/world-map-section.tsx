"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, TrendingDown, Droplets, BarChart3, Building, Thermometer, Package, Zap, HardHat } from "lucide-react"

interface Driver {
  id: string
  name: string
  icon: React.ReactNode
  region: string
  position: { x: number; y: number }
  isActive: boolean
}

const drivers: Driver[] = [
  {
    id: "1",
    name: "Stock levels for oil",
    icon: <Droplets className="h-full w-full text-blue-500" />,
    region: "Europe",
    position: { x: 45, y: 35 },
    isActive: true
  },
  {
    id: "2",
    name: "Construction activity",
    icon: <HardHat className="h-full w-full text-gray-500" />,
    region: "North America",
    position: { x: 22, y: 37 },
    isActive: false
  },
  {
    id: "3",
    name: "Market trends",
    icon: <BarChart3 className="h-full w-full text-gray-500" />,
    region: "North America",
    position: { x: 25, y: 41 },
    isActive: false
  },
  {
    id: "4",
    name: "Energy production",
    icon: <Zap className="h-full w-full text-gray-500" />,
    region: "Europe",
    position: { x: 50, y: 48 },
    isActive: false
  },
  {
    id: "5",
    name: "Market trends",
    icon: <BarChart3 className="h-full w-full text-gray-500" />,
    region: "Europe",
    position: { x: 52, y: 52 },
    isActive: false
  },
  {
    id: "6",
    name: "Infrastructure",
    icon: <Building className="h-full w-full text-gray-500" />,
    region: "Africa",
    position: { x: 45, y: 67 },
    isActive: false
  },
  {
    id: "7",
    name: "Climate impact",
    icon: <Thermometer className="h-full w-full text-gray-500" />,
    region: "South America",
    position: { x: 33, y: 75 },
    isActive: false
  },
  {
    id: "8",
    name: "Supply chain",
    icon: <Package className="h-full w-full text-gray-500" />,
    region: "Asia",
    position: { x: 72, y: 52 },
    isActive: false
  },
  {
    id: "9",
    name: "Trade logistics",
    icon: <BarChart3 className="h-full w-full text-gray-500" />,
    region: "Asia",
    position: { x: 76, y: 56 },
    isActive: false
  },
  {
    id: "10",
    name: "Climate impact",
    icon: <Thermometer className="h-full w-full text-gray-500" />,
    region: "Oceania",
    position: { x: 82, y: 82 },
    isActive: false
  }
]

export function WorldMapSection() {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(drivers[0])
  const [isCardVisible, setIsCardVisible] = useState(true)

  const handleDriverClick = (driver: Driver) => {
    setSelectedDriver(driver)
    setIsCardVisible(true)
  }

  const closeCard = () => {
    setIsCardVisible(false)
  }

  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-gray-50 rounded-lg overflow-hidden">
      {/* World Map */}
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
              driver.isActive 
                ? 'border-blue-500 bg-blue-100 shadow-lg' 
                : 'border-gray-400 bg-gray-100 hover:border-gray-500'
            }`}
            style={{
              left: `${driver.position.x}%`,
              top: `${driver.position.y}%`
            }}
          >
            <div className="flex items-center justify-center w-full h-full">
              <div className="w-3 h-3 md:w-4 md:h-4">
                {driver.icon}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Driver Card */}
      {isCardVisible && selectedDriver && (
        <div className="absolute right-2 md:right-4 top-16 md:top-20 w-72 md:w-80 max-w-[90vw] md:max-w-none">
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 md:w-5 md:h-5">
                    {selectedDriver.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">{selectedDriver.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600">{selectedDriver.region}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeCard}
                  className="h-6 w-6 md:h-8 md:w-8 p-0"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 md:space-y-4">
              {/* Key Metrics */}
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">12.6M</div>
                <div className="text-xs md:text-sm text-red-600">-60% from last year</div>
              </div>

              {/* Impact Statement */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm font-medium">24% Lower goods output</span>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-24 md:h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2" />
                  <p className="text-xs md:text-sm">Chart visualization</p>
                  <p className="text-xs">Last: 905,966</p>
                  <p className="text-xs">Target: 560,000</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                If energy pressures, trade fragility, and climate disruptions persist, 
                PVC additive demand is likely to remain flat or decline slightly in late 2025 
                as cost and supply-side constraints dampen production.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
