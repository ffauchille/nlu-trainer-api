
type ErrorType = "RASA"

export type APIError = {
    type: ErrorType;
    err: Error
}

export const onError = (error: APIError) => {
    switch (error.type) {
        case "RASA": {
            console.log("[ RASA ERROR ]: ", error.err)
            break;
        }
        default: {
            console.log("[ API Error ]: ", error.err)
        }
    }
}