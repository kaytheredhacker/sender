export const getCurrentTemplate = (templates, emailCount) => {
    if (!templates || templates.length === 0) {
        throw new Error('No templates available');
    }
    const index = Math.floor(emailCount / 50) % templates.length;
    return templates[index];
};

export const delay = async (minMs = 3000, maxMs = 9000) => {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    console.log(`Waiting for ${delayTime/1000} seconds before sending next email...`);
    await new Promise(resolve => setTimeout(resolve, delayTime));
};