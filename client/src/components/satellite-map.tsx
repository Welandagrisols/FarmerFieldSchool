import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/components/ui/leaflet.css';
import { type Farm, type Plot } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Satellite, Map as MapIcon, ZoomIn, ZoomOut } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SatelliteMapProps {
  farm: Farm;
  plots: Plot[];
  fieldMeasurement?: any;
  onPlotClick?: (plot: Plot) => void;
}

interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const MAP_LAYERS: MapLayer[] = [
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19
  },
  {
    id: 'street',
    name: 'Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    maxZoom: 19
  }
];

const PLOT_COLORS = {
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
} as const;

// Component to fit map to farm boundaries
function FitToBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, coordinates]);
  
  return null;
}

export function SatelliteMap({ farm, plots, fieldMeasurement, onPlotClick }: SatelliteMapProps) {
  const [activeLayer, setActiveLayer] = useState<string>('satellite');
  const [showPlots, setShowPlots] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);

  // Get farm center coordinates
  const farmCenter: [number, number] = React.useMemo(() => {
    if (farm.latitude && farm.longitude) {
      return [parseFloat(farm.latitude), parseFloat(farm.longitude)];
    }
    // Default to a central location if no coordinates
    return [0.0, 37.0]; // Kenya center as default
  }, [farm.latitude, farm.longitude]);

  // Convert field measurement to polygon coordinates
  const boundaryCoordinates: [number, number][] = React.useMemo(() => {
    if (fieldMeasurement?.points) {
      return fieldMeasurement.points.map((point: any) => [point.latitude, point.longitude]);
    }
    // Create a default boundary around the farm center if no measurement
    if (farm.latitude && farm.longitude) {
      const lat = parseFloat(farm.latitude);
      const lng = parseFloat(farm.longitude);
      const offset = 0.001; // ~100m
      return [
        [lat + offset, lng - offset],
        [lat + offset, lng + offset],
        [lat - offset, lng + offset],
        [lat - offset, lng - offset],
      ];
    }
    return [];
  }, [fieldMeasurement, farm.latitude, farm.longitude]);

  // Convert plots to map coordinates (this would need real coordinate conversion)
  const plotMarkers = React.useMemo(() => {
    if (!showPlots) return [];
    
    return plots.map((plot, index) => {
      // For now, distribute plots around the farm center
      // In a real implementation, you'd convert grid positions to GPS coordinates
      const lat = farmCenter[0] + (plot.y - 15) * 0.0001;
      const lng = farmCenter[1] + (plot.x - 15) * 0.0001;
      
      return {
        ...plot,
        coordinates: [lat, lng] as [number, number]
      };
    });
  }, [plots, farmCenter, showPlots]);

  const currentLayer = MAP_LAYERS.find(layer => layer.id === activeLayer) || MAP_LAYERS[0];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Map Controls */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Farm Satellite View - {farm.name}
            </CardTitle>
            <Badge variant="outline">
              {fieldMeasurement ? 
                `${fieldMeasurement.area.acres.toFixed(2)} acres` : 
                farm.farmSize ? `${farm.farmSize} acres` : 'Area not surveyed'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Layer Selection */}
            <div className="flex gap-1">
              {MAP_LAYERS.map((layer) => (
                <Button
                  key={layer.id}
                  variant={activeLayer === layer.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLayer(layer.id)}
                >
                  {layer.id === 'satellite' && <Satellite className="h-4 w-4 mr-1" />}
                  {layer.id === 'street' && <MapIcon className="h-4 w-4 mr-1" />}
                  {layer.id === 'terrain' && <Layers className="h-4 w-4 mr-1" />}
                  {layer.name}
                </Button>
              ))}
            </div>

            {/* Toggle Overlays */}
            <div className="flex gap-1">
              <Button
                variant={showBoundary ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBoundary(!showBoundary)}
              >
                Farm Boundary
              </Button>
              <Button
                variant={showPlots ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPlots(!showPlots)}
              >
                Planned Plots ({plots.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="flex-1 min-h-[500px] border rounded-lg overflow-hidden">
        <MapContainer
          center={farmCenter}
          zoom={16}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            url={currentLayer.url}
            attribution={currentLayer.attribution}
            maxZoom={currentLayer.maxZoom}
          />
          
          {/* Fit map to boundaries */}
          {boundaryCoordinates.length > 0 && (
            <FitToBounds coordinates={boundaryCoordinates} />
          )}

          {/* Farm Boundary Overlay */}
          {showBoundary && boundaryCoordinates.length > 0 && (
            <Polygon
              positions={boundaryCoordinates}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 3,
                dashArray: '5, 10'
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>Farm Boundary</strong><br />
                  {fieldMeasurement && (
                    <>
                      Area: {fieldMeasurement.area.acres.toFixed(2)} acres<br />
                      Perimeter: {(fieldMeasurement.perimeter / 1000).toFixed(2)} km
                    </>
                  )}
                </div>
              </Popup>
            </Polygon>
          )}

          {/* Plot Markers */}
          {plotMarkers.map((plot) => (
            <Marker
              key={plot.id}
              position={plot.coordinates}
              eventHandlers={{
                click: () => onPlotClick?.(plot)
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{plot.name}</strong><br />
                  Size: {plot.width} × {plot.height}<br />
                  {plot.cropType && `Crop: ${plot.cropType}`}
                  <div 
                    className="w-4 h-4 rounded mx-auto mt-2"
                    style={{ backgroundColor: PLOT_COLORS[plot.color as keyof typeof PLOT_COLORS] || PLOT_COLORS.green }}
                  />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Farm Center Marker */}
          {farm.latitude && farm.longitude && (
            <Marker position={farmCenter}>
              <Popup>
                <div className="text-center">
                  <strong>{farm.name}</strong><br />
                  Owner: {farm.ownerName}<br />
                  Location: {farm.location}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-green-500" style={{ borderStyle: 'dashed', borderWidth: '2px 0' }}></div>
              <span>Farm Boundary</span>
            </div>
            {plots.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Planned Plots</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Farm Center</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}