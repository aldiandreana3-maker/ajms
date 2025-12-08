import { MainLayout } from "@/components/layout/MainLayout";
import { Bed, Bath, Maximize, Check } from "lucide-react";

const unitTypes = [
  {
    id: 1,
    name: "Studio",
    size: "21 m²",
    bedroom: 0,
    bathroom: 1,
    price: "Rp 350.000.000",
    features: ["AC Split", "Water Heater", "Kitchen Set"],
    available: 45,
    color: "primary",
  },
  {
    id: 2,
    name: "1 Bedroom",
    size: "36 m²",
    bedroom: 1,
    bathroom: 1,
    price: "Rp 550.000.000",
    features: ["AC Split", "Water Heater", "Kitchen Set", "Balcony"],
    available: 32,
    color: "accent",
  },
  {
    id: 3,
    name: "2 Bedroom",
    size: "54 m²",
    bedroom: 2,
    bathroom: 1,
    price: "Rp 780.000.000",
    features: ["AC Split 2 Unit", "Water Heater", "Kitchen Set", "Balcony", "Service Area"],
    available: 18,
    color: "info",
  },
  {
    id: 4,
    name: "3 Bedroom",
    size: "72 m²",
    bedroom: 3,
    bathroom: 2,
    price: "Rp 1.200.000.000",
    features: ["AC Split 3 Unit", "Water Heater", "Kitchen Set", "Balcony", "Service Area", "Parking Slot"],
    available: 8,
    color: "warning",
  },
];

const TypeUnit = () => {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Type Unit</h1>
          <p className="text-muted-foreground">Pilihan tipe unit yang tersedia</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {unitTypes.map((unit, index) => (
            <div
              key={unit.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="bg-primary p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-primary-foreground">{unit.name}</h3>
                  <span className="px-3 py-1 bg-primary-foreground/20 text-primary-foreground text-sm font-medium rounded-full">
                    {unit.available} unit
                  </span>
                </div>
                <p className="text-primary-foreground/80 text-2xl font-bold mt-2">{unit.price}</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Maximize className="w-4 h-4" />
                    <span className="text-sm font-medium">{unit.size}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bed className="w-4 h-4" />
                    <span className="text-sm font-medium">{unit.bedroom} BR</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bath className="w-4 h-4" />
                    <span className="text-sm font-medium">{unit.bathroom} BA</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {unit.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default TypeUnit;
