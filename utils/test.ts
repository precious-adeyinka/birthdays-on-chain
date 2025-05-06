/* Generate selectors for contract */
const getSelectors = (contract: any) => {
    if (!contract) return [];

    // Get all function fragments
    const fragments = contract.interface.fragments.filter(
        (fragment: any) => fragment.type === 'function'
    );

    // Generate selectors using the full function signature
    const selectors = fragments
        .map((fragment: any) => contract.interface.getFunction(fragment.name).selector)
        .filter((selector: string) => selector !== '0x01ffc9a7'); // Exclude IERC165 supportsInterface

    return selectors;
}

// Add enum for facet cut actions
const FacetCutAction = {
    Add: 0,
    Replace: 1,
    Remove: 2
};

const ZERO_ADDRESS = `0x${"0".repeat(40)}`

export { getSelectors, FacetCutAction, ZERO_ADDRESS };