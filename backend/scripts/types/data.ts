export interface FileData {
    id: string;
    source?: string;
    filename?: string;
    title?: string;
    description?: string;
    text?: string;
    artist?: string;
    culture?: string;
    country?: string;
    continent?: string;
    medium?: string;
    style?: string;
    begin?: number;
    end?: number;
    dated?: string;
    accession_number?: string;
    department?: string;
    classification?: string;
    object_name?: string;
    nationality?: string;
    dimension?: string;
    provenance?: string;
    creditline?: string;
    life_date?: string;
    markings?: string;
    inscription?: string;
    portfolio?: string;
    room?: string;
    rights_type?: string;
    // eslint-disable-next-line
    [key: string]: any;
}
