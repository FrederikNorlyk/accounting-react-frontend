import { MultiRecordResult } from "@/models/MultiRecordResult";
import { SingleRecordResult } from "@/models/SingleRecordResult";
import { SortBy } from "@/query/SortBy";
import { getSession } from "next-auth/react";

/**
 * Abstract base class for all clients that query and modify database records.
 */
export default abstract class DatabaseRecordClient<T extends DatabaseRecord> {

    private domain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN

    /**
     * Defines the endpoint used when querying the API.
     */
    abstract getEndpoint(): string

    /**
     * Converts the types of the given record's fields to their specifications.
     * 
     * @param record 
     */
    abstract parse(record: any): T

    /**
     * Gets the user's access token.
     * 
     * @returns the user's access token
     */
    protected async getAccessToken(): Promise<string> {
        const session = await getSession()

        if (!session) {
            console.error("Could not get session")
            return ""
        }

        return session.user.token
    }

    /**
     * Fetches a list of records.
     * 
     * @returns a list of records
     */
    public async fetch(sortBy: SortBy, page: number = 1): Promise<MultiRecordResult<T>> {
        const token = await this.getAccessToken()

        const searchParams = new URLSearchParams({
            sortField: sortBy.field,
            sortDir: sortBy.getDirectionAsString(),
            page: page.toString()
        })

        const url = `${this.domain}${this.getEndpoint()}?${searchParams}`

        var response
        try {
            response = await fetch(url, {
                headers: {
                    "Authorization": `Token ${token}`
                },
                cache: 'no-store'
            })
        } catch (error) {
            return MultiRecordResult.asErrorResult(503, "Could not connect to the API")
        }

        const json = await response.json()

        if (response.status != 200) {
            var error = "Unknown error"
            if (json.detail) {
                error = json.detail
            } else if (json.details?.length > 0) {
                error = json.details[0]
            }
            return MultiRecordResult.asErrorResult(response.status, error)
        }

        var records = [] as T[]
        for (let index = 0; index < json.results.length; index++) {
            const record = json.results[index];
            records.push(this.parse(record))
        }

        const hasPreviousPage = json.previous != null
        const hasNextPage = json.next != null

        return MultiRecordResult.asSuccessResult(response.status, records, page, hasPreviousPage, hasNextPage)
    }

    /**
     * Gets a single record.
     * 
     * @param id id of the record to get
     * @returns a result containing the record or an error message
     */
    public async get(id: number): Promise<SingleRecordResult<T>> {
        const token = await this.getAccessToken()
        const url = this.domain + this.getEndpoint() + id + "/"

        var response
        try {
            response = await fetch(url, {
                headers: {
                    "Authorization": `Token ${token}`
                },
                cache: 'no-store'
            })
        } catch (error) {
            return SingleRecordResult.asErrorResult(503, "Could not connect to the API")
        }

        const json = await response.json()

        if (response.status != 200) {
            var error = json.detail ?? "Unknown error"
            return SingleRecordResult.asErrorResult(response.status, error)
        }

        const newRecord = this.parse(json)
        return SingleRecordResult.asSuccessResult(response.status, newRecord)
    }

    /**
     * Adds a record using HTTP POST.
     * 
     * @param record the record to add
     * @returns a result containing the created record or an error message
     */
    public async post(record: T): Promise<SingleRecordResult<T>> {
        const url = this.domain + this.getEndpoint()
        return this.submit(record, url, "POST")
    }

    /**
    * Updates a record using HTTP PUT.
    * 
    * @param record the record to update
    * @returns a result containing the updated record or an error message
    */
    public async put(record: T): Promise<SingleRecordResult<T>> {
        const url = this.domain + this.getEndpoint() + record.id + "/"
        return this.submit(record, url, "PUT")
    }

    private async submit(record: T, url: string, method: string): Promise<SingleRecordResult<T>> {
        const token = await this.getAccessToken()

        var response
        try {
            response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                body: JSON.stringify(record),
            })
        } catch (error) {
            return SingleRecordResult.asErrorResult(503, "Could not connect to API")
        }

        const json = await response.json()

        if (response.status != 200 && response.status != 201) {
            var error = "Unknown error"
            if (json.detail) {
                error = json.detail
            } else if (json.details?.length > 0) {
                error = json.details[0]
            }
            return SingleRecordResult.asErrorResult(response.status, error)
        }

        const newRecord = this.parse(json)
        return SingleRecordResult.asSuccessResult(response.status, newRecord)
    }

    public async delete(id: number): Promise<Response | null> {
        const token = await this.getAccessToken()
        const url = this.domain + this.getEndpoint() + id + "/"

        var response
        try {
            response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Token ${token}`
                },
            })
        } catch (error) {
            return null
        }

        return response
    }
}