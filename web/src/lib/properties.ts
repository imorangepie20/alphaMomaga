export type PropertyStatus = "Occupied" | "Active" | "Pending";

export type Property = {
  id: string;
  name: string;
  location: string;
  type: string;
  occupancy: string;
  status: PropertyStatus;
};

const fallbackProperties: Property[] = [
  { id: "property-1", name: "Seoul Heights Tower", location: "Seoul, KR", type: "Apartment", occupancy: "96%", status: "Occupied" },
  { id: "property-2", name: "Hana Village", location: "Busan, KR", type: "Townhouse", occupancy: "88%", status: "Active" },
  { id: "property-3", name: "Blue Park Residences", location: "Incheon, KR", type: "Officetel", occupancy: "82%", status: "Pending" },
  { id: "property-4", name: "Riverside Point", location: "Daegu, KR", type: "Commercial", occupancy: "91%", status: "Occupied" },
];

export async function getProperties(): Promise<Property[]> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return fallbackProperties;
  }

  try {
    const response = await fetch(`${apiUrl}/properties`, { cache: "no-store" });
    if (!response.ok) {
      return fallbackProperties;
    }

    return (await response.json()) as Property[];
  } catch {
    return fallbackProperties;
  }
}