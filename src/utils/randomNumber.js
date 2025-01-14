import { TMS_TransportSubCategory } from "../models/transportsubcategory.model.js";

const generateRandomID = async () => {
    let id;
    let isUnique = false;

    while (!isUnique) {
        id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const existingDoc = await TMS_TransportSubCategory.findOne({
            transportID: id,
        });
        if (!existingDoc) {
            isUnique = true;
        }
    }

    return id;
};
export { generateRandomID };
