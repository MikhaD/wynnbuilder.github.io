

const translate_mappings = {
    //"Name": "name",
    //"Display Name": "displayName",
    //"tier"Tier": ",
    //"Set": "set",
    "Powder Slots": "slots",
    //"Type": "type",
    //"armorType", (deleted)
    //"color", (deleted)
    //"lore", (deleted)
    //"material", (deleted)
    "Drop type": "drop",
    "Quest requirement": "quest",
    "Restriction": "restrict",
    //"Base Neutral Damage": "nDam",
    //"Base Fire Damage": "fDam",
    //"Base Water Damage": "wDam",
    //"Base Air Damage": "aDam",
    //"Base Thunder Damage": "tDam",
    //"Base Earth Damage": "eDam",
    //"Base Attack Speed": "atkSpd",
    "Health": "hp",
    "Raw Fire Defense": "fDef",
    "Raw Water Defense": "wDef",
    "Raw Air Defense": "aDef",
    "Raw Thunder Defense": "tDef",
    "Raw Earth Defense": "eDef",
    "Combat Level": "lvl",
    //"Class Requirement": "classReq",
    "Req Strength": "strReq",
    "Req Dexterity": "dexReq",
    "Req Intelligence": "intReq",
    "Req Agility": "agiReq",
    "Req Defense": "defReq",
    "% Health Regen": "hprPct",
    "Mana Regen": "mr",
    "% Spell Damage": "sdPct",
    "% Melee Damage": "mdPct",
    "Life Steal": "ls",
    "Mana Steal": "ms",
    "XP Bonus": "xpb",
    "Loot Bonus": "lb",
    "Reflection": "ref",
    "Strength": "str",
    "Dexterity": "dex",
    "Intelligence": "int",
    "Agility": "agi",
    "Defense": "def",
    "Thorns": "thorns",
    "Exploding": "expd",
    "Walk Speed": "spd",
    "Attack Speed Bonus": "atkTier",
    "Poison": "poison",
    "Health Bonus": "hpBonus",
    "Soul Point Regen": "spRegen",
    "Stealing": "eSteal",
    "Raw Health Regen": "hprRaw",
    "Raw Spell": "sdRaw",
    "Raw Melee": "mdRaw",
    "% Fire Damage": "fDamPct",
    "% Water Damage": "wDamPct",
    "% Air Damage": "aDamPct",
    "% Thunder Damage": "tDamPct",
    "% Earth Damage": "eDamPct",
    "% Fire Defense": "fDefPct",
    "% Water Defense": "wDefPct",
    "% Air Defense": "aDefPct",
    "% Thunder Defense": "tDefPct",
    "% Earth Defense": "eDefPct",
    "Fixed IDs": "fixID",
    "Custom Skin": "skin",
    //"Item Category": "category",

    "1st Spell Cost %": "spPct1",
    "1st Spell Cost Raw": "spRaw1",
    "2nd Spell Cost %": "spPct2",
    "2nd Spell Cost Raw": "spRaw2",
    "3rd Spell Cost %": "spPct3",
    "3rd Spell Cost Raw": "spRaw3",
    "4th Spell Cost %": "spPct4",
    "4th Spell Cost Raw": "spRaw4",

    "Rainbow Spell Damage": "rainbowRaw",
    "Sprint": "sprint",
    "Sprint Regen": "sprintReg",
    "Jump Height": "jh",
    "Loot Quality": "lq",

    "Gather XP Bonus": "gXp",
    "Gather Speed Bonus": "gSpd",
};

const special_mappings = {
    "Sum (skill points)": new SumQuery(["str", "dex", "int", "def", "agi"]),
    "Sum (Mana Sustain)": new SumQuery(["mr", "ms"]),
    "Sum (Life Sustain)": new SumQuery(["hpr", "ls"]),
    "Sum (Health + Health Bonus)": new SumQuery(["hp", "hpBonus"]),
    "No Strength Req": new NegateQuery("strReq"),
    "No Dexterity Req": new NegateQuery("dexReq"),
    "No Intelligence Req": new NegateQuery("intReq"),
    "No Agility Req": new NegateQuery("agiReq"),
    "No Defense Req": new NegateQuery("defReq"),
};

let itemFilters = document.getElementById("filter-items");
for (let x in translate_mappings) {
    let el = document.createElement("option");
    el.value = x;
    itemFilters.appendChild(el);
}
for (let x in special_mappings) {
    let el = document.createElement("option");
    el.value = x;
    itemFilters.appendChild(el);
}

let itemCategories = [ "armor", "accessory", "weapon" ];

function applyQuery(items, query) {
    return items.filter(query.filter, query).sort(query.compare);
}

function displayItems(items_copy) {
    let items_parent = document.getElementById("main");
    for (let i in items_copy) {
        let item = items_copy[i];
        let box = document.createElement("div");
        box.classList.add("box");
        box.id = "item"+i;
        items_parent.appendChild(box);
        displayExpandedItem(item, box.id);
    }
}

let items_expanded;

    // updates the current search state from the search query input boxes
    function updateSearch() {
        // compile query expressions, aborting if nothing has changed or either fails to compile
        const changed = searchFilterField.compile() | searchSortField.compile();
        if (!changed || searchFilterField.output === null || searchSortField.output === null) return;

        // update url query string
        const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
            + `?f=${encodeURIComponent(searchFilterField.value)}&s=${encodeURIComponent(searchSortField.value)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        // hide old search results
        itemListFooter.innerText = '';
        for (const itemEntry of itemEntries) itemEntry.classList.remove('visible');

        // index and sort search results
        const searchResults = [];
        try {
            for (let i = 0; i < searchDb.length; i++) {
                const item = searchDb[i][0], itemExp = searchDb[i][1];
                if (checkBool(searchFilterField.output.resolve(item, itemExp))) {
                    searchResults.push({ item, itemExp, sortKeys: searchSortField.output.resolve(item, itemExp) });
                }
            }
        } catch (e) {
            searchFilterField.errorText.innerText = e.message;
            return;
        }
        if (searchResults.length === 0) {
            itemListFooter.innerText = 'No results!';
            return;
        }
        try {
            searchResults.sort((a, b) => {
                try {
                    return compareLexico(a.item, a.sortKeys, b.item, b.sortKeys);
                } catch (e) {
                    console.log(a.item, b.item);
                    throw e;
                }
            });
        } catch (e) {
            searchSortField.errorText.innerText = e.message;
            return;
        }

        // display search results
        const searchMax = Math.min(searchResults.length, ITEM_LIST_SIZE);
        for (let i = 0; i < searchMax; i++) {
            const result = searchResults[i];
            itemEntries[i].classList.add('visible');
            displayExpandedItem(result.itemExp, `item-entry-${i}`);
            if (result.sortKeys.length > 0) {
                const sortKeyListContainer = document.createElement('div');
                sortKeyListContainer.classList.add('itemleft');
                const sortKeyList = document.createElement('ul');
                sortKeyList.classList.add('item-entry-sort-key', 'itemp', 'T0');
                sortKeyListContainer.append(sortKeyList);
                for (let j = 0; j < result.sortKeys.length; j++) {
                    const sortKeyElem = document.createElement('li');
                    sortKeyElem.innerText = stringify(result.sortKeys[j]);
                    sortKeyList.append(sortKeyElem);
                }
                itemEntries[i].append(sortKeyListContainer);
            }
        }
        if (searchMax < searchResults.length) {
            itemListFooter.innerText = `${searchResults.length - searchMax} more...`;
        }
    }

function doItemSearch() {
    window.scrollTo(0, 0);
    let queries = [];
    queries.push(new NameQuery(document.getElementById("name-choice").value.trim()));

    let categoryOrType = document.getElementById("category-choice").value;
    if (itemTypes.includes(categoryOrType)) {
        queries.push(new IdMatchQuery("type", categoryOrType));
    }
    else if (itemCategories.includes(categoryOrType)) {
        queries.push(new IdMatchQuery("category", categoryOrType));
    }

    let rarity = document.getElementById("rarity-choice").value;
    if (rarity) {
        if (rarity === "ANY") {

        }
        else {
            queries.push(new IdMatchQuery("tier", rarity));
        }
    }

    let level_dat = document.getElementById("level-choice").value.split("-");
    queries.push(new LevelRangeQuery(parseInt(level_dat[0]), parseInt(level_dat[1])));
    
    for (let i = 1; i <= 4; ++i) {
        let raw_dat = document.getElementById("filter"+i+"-choice").value;
        let filter_dat = translate_mappings[raw_dat];
        if (filter_dat !== undefined) {
            queries.push(new IdQuery(filter_dat));
            continue;
        }
        filter_dat = special_mappings[raw_dat];
        if (filter_dat !== undefined) {
            queries.push(filter_dat);
            continue;
        }
    }

    let items_copy = items_expanded.slice();
    document.getElementById("main").textContent = "";
    for (const query of queries) {
        console.log(items_copy.length);
        console.log(query);
        console.log(query.filter);
        items_copy = applyQuery(items_copy, query);
        console.log(items_copy.length);
    }
    document.getElementById("summary").textContent = items_copy.length + " results."
    displayItems(items_copy);
}

function init_items() {
    items_expanded = items.filter( (i) => !("remapID" in i) ).map( (i) => expandItem(i, []) );
}

load_init(init_items);
