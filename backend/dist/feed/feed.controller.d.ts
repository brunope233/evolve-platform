import { FeedService } from './feed.service';
export declare class FeedController {
    private readonly feedService;
    constructor(feedService: FeedService);
    getFeed(req: any, page?: string): Promise<import("../proofs/proof.entity").Proof[]>;
}
