export interface GetAllTop15 {
    ok:      boolean;
    parkeds: Parked[];
}

export interface Parked {
    id_vehicle:  number;
    suma_amount: string;
    vehicle: Vehicle;
}

interface Vehicle {
    id: number;
    placa: string;
    mark: string;
    description: string;
}
// Year

export interface GetAllTopYear {
    ok:      boolean;
    parkeds: Parked[];
}

export interface Parked {
    createdAt:   string;
    suma_amount: string;
}
