import { SearchService } from './search.service';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchJourneys(query: string): Promise<import("../journeys/journey.entity").Journey[]>;
}
