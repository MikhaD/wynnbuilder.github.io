/**
 * Apply armor powdering.
 * Also for jeweling for crafted items.
 */
function applyArmorPowders(expandedItem, powders) {
    applyArmorPowdersOnce(expandedItem, powders);
    if (expandedItem.get("crafted")) {
        applyArmorPowdersOnce(expandedItem, powders);
    }
}
function applyArmorPowdersOnce(expandedItem, powders) {
    for(const id of powders){
        let powder = powderStats[id];
        let name = powderNames.get(id);
        expandedItem.set(name.charAt(0) + "Def", (expandedItem.get(name.charAt(0)+"Def") || 0) + powder["defPlus"]);
        expandedItem.set(skp_elements[(skp_elements.indexOf(name.charAt(0)) + 4 )% 5] + "Def", (expandedItem.get(skp_elements[(skp_elements.indexOf(name.charAt(0)) + 4 )% 5]+"Def") || 0) - powder["defMinus"]);
    }
}

function expandItem(item, powders) {
    let minRolls = new Map();
    let maxRolls = new Map();
    let expandedItem = new Map();
    if(item.fixID){ //The item has fixed IDs.
        expandedItem.set("fixID",true);
        for (const id of rolledIDs){ //all rolled IDs are numerical
            let val = (item[id] || 0);
            //if(item[id]) {
                minRolls.set(id,val);
                maxRolls.set(id,val);
            //}
        }
    }else{ //The item does not have fixed IDs.
        for (const id of rolledIDs){
            let val = (item[id] || 0);
            if(val > 0){ // positive rolled IDs                   
                if (reversedIDs.includes(id)) {
                    maxRolls.set(id,idRound(val*0.3));
                    minRolls.set(id,idRound(val*1.3));
                } else {
                    maxRolls.set(id,idRound(val*1.3));
                    minRolls.set(id,idRound(val*0.3));
                }
            }else if(val < 0){ //negative rolled IDs
                if (reversedIDs.includes(id)) {
                    maxRolls.set(id,idRound(val*1.3));
                    minRolls.set(id,idRound(val*0.7));
                }
                else {
                    minRolls.set(id,idRound(val*1.3));
                    maxRolls.set(id,idRound(val*0.7));
                }
            }else{//Id = 0
                minRolls.set(id,0);
                maxRolls.set(id,0);
            }
        }
    }
    for (const id of nonRolledIDs){
        expandedItem.set(id,item[id]);
    }
    expandedItem.set("minRolls",minRolls);
    expandedItem.set("maxRolls",maxRolls);
    expandedItem.set("powders", powders);
    if(item.category === "armor") {
        applyArmorPowders(expandedItem, powders);
    }
    return expandedItem;
}

/* Takes in an ingredient object and returns an equivalent Map().
*/
function expandIngredient(ing) {
    let expandedIng = new Map();
    let mapIds = ['consumableIDs', 'itemIDs', 'posMods'];
    for (const id of mapIds) {
        let idMap = new Map();
        for (const key of Object.keys(ing[id])) {
            idMap.set(key, ing[id][key]);
        }
        expandedIng.set(id, idMap);
    }
    let normIds = ['lvl','name', 'displayName','tier','skills','id'];
    for (const id of normIds) {
        expandedIng.set(id, ing[id]);
    }
    if (ing['isPowder']) {
        expandedIng.set("isPowder",ing['isPowder']);
        expandedIng.set("pid",ing['pid']);
    }
    //now the actually hard one
    let idMap = new Map();
    idMap.set("minRolls", new Map());
    idMap.set("maxRolls", new Map());
    for (const field of ingFields) {
        let val = (ing['ids'][field] || 0);
        idMap.get("minRolls").set(field, val['minimum']);
        idMap.get("maxRolls").set(field, val['maximum']);
    }
    expandedIng.set("ids",idMap);
    return expandedIng;
}

/* Takes in a recipe object and returns an equivalent Map().
*/
function expandRecipe(recipe) {
    let expandedRecipe = new Map();
    let normIDs = ["name", "skill", "type","id"];
    for (const id of normIDs) {
        expandedRecipe.set(id,recipe[id]);
    }
    let rangeIDs = ["durability","lvl", "healthOrDamage", "duration", "basicDuration"];
    for (const id of rangeIDs) {
        if(recipe[id]){
            expandedRecipe.set(id, [recipe[id]['minimum'], recipe[id]['maximum']]);
        } else {
            expandedRecipe.set(id, [0,0]);
        }
    }
    expandedRecipe.set("materials", [ new Map([ ["item", recipe['materials'][0]['item']], ["amount", recipe['materials'][0]['amount']] ]) , new Map([ ["item", recipe['materials'][1]['item']], ["amount",recipe['materials'][1]['amount'] ] ]) ]);
    return expandedRecipe;
}

/*An independent helper function that rounds a rolled ID to the nearest integer OR brings the roll away from 0.
* @param id
*/
function idRound(id){
    rounded = Math.round(id);
    if(rounded == 0){
        return 1; //this is a hack, will need changing along w/ rest of ID system if anything changes
    }else{
        return rounded;
    }
}

function apply_elemental_format(p_elem, id, suffix) {
    suffix = (typeof suffix !== 'undefined') ?  suffix : "";
    // THIS IS SO JANK BUT IM TOO LAZY TO FIX IT TODO
    let parts = idPrefixes[id].split(/ (.*)/);
    let element_prefix = parts[0];
    let desc = parts[1];
    let i_elem = document.createElement('b');
    i_elem.classList.add(element_prefix);
    i_elem.textContent = element_prefix;
    p_elem.appendChild(i_elem);

    let i_elem2 = document.createElement('b');
    i_elem2.textContent = " " + desc + suffix;
    p_elem.appendChild(i_elem2);
}

function displaySetBonuses(parent_id,build) {
    setHTML(parent_id, "");
    let parent_div = document.getElementById(parent_id);

    let set_summary_elem = document.createElement('p');
    set_summary_elem.classList.add('itemcenter');
    set_summary_elem.textContent = "Set Bonuses:";
    parent_div.append(set_summary_elem);
    
    if (build.activeSetCounts.size) {
        parent_div.parentElement.style.display = "block";
    } else {
        parent_div.parentElement.style.display = "none";
    }

    for (const [setName, count] of build.activeSetCounts) {
        const active_set = sets[setName];
        if (active_set["hidden"]) { continue; }

        let set_elem = document.createElement('p');
        set_elem.id = "set-"+setName;
        set_summary_elem.append(set_elem);
        
        const bonus = active_set.bonuses[count-1];
        let mock_item = new Map();
        mock_item.set("fixID", true);
        mock_item.set("displayName", setName+" Set: "+count+"/"+sets[setName].items.length);
        let mock_minRolls = new Map();
        let mock_maxRolls = new Map();
        mock_item.set("minRolls", mock_minRolls);
        mock_item.set("maxRolls", mock_maxRolls);
        for (const id in bonus) {
            if (rolledIDs.includes(id)) {
                mock_minRolls.set(id, bonus[id]);
                mock_maxRolls.set(id, bonus[id]);
            }
            else {
                mock_item.set(id, bonus[id]);
            }
        }
        mock_item.set("powders", []);
        displayExpandedItem(mock_item, set_elem.id);
        console.log(mock_item);
    }
}


function displayBuildStats(parent_id,build){
    // Commands to "script" the creation of nice formatting.
    // #commands create a new element.
    // !elemental is some janky hack for elemental damage.
    // normals just display a thing.

    let display_commands = build_overall_display_commands;

    // Clear the parent div.
    setHTML(parent_id, "");
    let parent_div = document.getElementById(parent_id);
    let title = document.createElement("p");
    title.classList.add("itemcenter");
    title.classList.add("itemp");
    title.classList.add("title");
    title.classList.add("Normal");
    title.textContent = "Overall Build Stats";
    parent_div.append(title);
    parent_div.append(document.createElement("br"));

    if (build.activeSetCounts.size > 0) {
        let set_summary_elem = document.createElement('p');
        set_summary_elem.classList.add('itemp');
        set_summary_elem.classList.add('left');
        set_summary_elem.textContent = "Set Summary:";
        parent_div.append(set_summary_elem);
        for (const [setName, count] of build.activeSetCounts) {
            const active_set = sets[setName];
            if (active_set["hidden"]) { continue; }

            let set_elem = document.createElement('p');
            set_elem.classList.add('itemp');
            set_elem.classList.add('left');
            set_elem.textContent = "    "+setName+" Set: "+count+"/"+sets[setName].items.length;
            set_summary_elem.append(set_elem);
        }
    }

    displayDefenseStats(parent_div, build, true);

    let stats = build.statMap;
    //console.log(build.statMap);
    
    let active_elem;
    let elemental_format = false;

    //TODO this is put here for readability, consolidate with definition in build.js
    let staticIDs = ["hp", "eDef", "tDef", "wDef", "fDef", "aDef"];

    for (const command of display_commands) {
        if (command.charAt(0) === "#") {
            if (command === "#cdiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemcenter');
            }
            else if (command === "#ldiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemleft');
            }
            else if (command === "#table") {
                active_elem = document.createElement('table');
                active_elem.classList.add('itemtable');
            }
            parent_div.appendChild(active_elem);
        }
        else if (command.charAt(0) === "!") {
            // TODO: This is sooo incredibly janky.....
            if (command === "!elemental") {
                elemental_format = !elemental_format;
            }
        }
        else {
            let id = command;
            if (stats.get(id)) {
                let style = null;
                if (!staticIDs.includes(id)) {
                    style = "positive";
                    if (stats.get(id) < 0) {
                        style = "negative";
                    }
                }
                let id_val = stats.get(id);
                if (reversedIDs.includes(id)) {
                    style === "positive" ? style = "negative" : style = "positive"; 
                }
                if (id === "poison" && id_val > 0) {
                    id_val = Math.ceil(id_val*build.statMap.get("poisonPct")/100);
                }
                displayFixedID(active_elem, id, id_val, elemental_format, style);
                if (id === "poison" && id_val > 0) {
                    let row = document.createElement('tr');
                    let value_elem = document.createElement('td');
                    value_elem.classList.add('right');
                    value_elem.setAttribute("colspan", "2");
                    let prefix_elem = document.createElement('b');
                    prefix_elem.textContent = "\u279C With Strength: ";
                    let number_elem = document.createElement('b');
                    number_elem.classList.add(style);
                    number_elem.textContent = (id_val * (1+skillPointsToPercentage(build.total_skillpoints[0])) ).toFixed(0) + idSuffixes[id];
                    value_elem.append(prefix_elem);
                    value_elem.append(number_elem);
                    row.appendChild(value_elem);

                    active_elem.appendChild(row);
                } else if (id === "ls" && id_val != 0) {
                    let row = document.createElement("tr");
                    let title = document.createElement("td");
                    title.classList.add("left");
                    title.textContent = "Effective Life Steal:"
                    let value = document.createElement("td");
                    let defStats = build.getDefenseStats();
                    value.textContent = Math.round(defStats[1][0]*id_val/defStats[0]) + "/3s";
                    value.classList.add("right");
                    value.classList.add(style);
                    row.appendChild(title);
                    row.appendChild(value);
                    active_elem.appendChild(row);
                }
            } else if (skp_order.includes(id)) {
                let total_assigned = build.total_skillpoints[skp_order.indexOf(id)];
                let base_assigned = build.base_skillpoints[skp_order.indexOf(id)];
                let diff = total_assigned - base_assigned;
                let style;
                if (diff > 0) {
                    style = "positive";
                } else if (diff < 0) {
                    style = "negative";
                }
                if (diff != 0) {
                    displayFixedID(active_elem, id, diff, false, style);
                }
            }
        }
    }
}


function displayExpandedItem(item, parent_id){
    // Commands to "script" the creation of nice formatting.
    // #commands create a new element.
    // !elemental is some janky hack for elemental damage.
    // normals just display a thing.
    if (item.get("category") === "weapon") {
        let stats = new Map();
        stats.set("atkSpd", item.get("atkSpd"));
        stats.set("damageBonus", [0, 0, 0, 0, 0]);

        //SUPER JANK @HPP PLS FIX
        let damage_keys = [ "nDam_", "eDam_", "tDam_", "wDam_", "fDam_", "aDam_" ];
        if (item.get("tier") !== "Crafted") {
            stats.set("damageRaw", [item.get("nDam"), item.get("eDam"), item.get("tDam"), item.get("wDam"), item.get("fDam"), item.get("aDam")]);
            let results = calculateSpellDamage(stats, [100, 0, 0, 0, 0, 0], 0, 0, 0, item, [0, 0, 0, 0, 0], 1, undefined);
            let damages = results[2];
            let total_damage = 0;
            for (const i in damage_keys) {
                total_damage += damages[i][0] + damages[i][1];
                item.set(damage_keys[i], damages[i][0]+"-"+damages[i][1]);
            }
            total_damage = total_damage / 2;
            item.set("basedps", total_damage);
            
        } else {
            stats.set("damageRaw", [item.get("nDamLow"), item.get("eDamLow"), item.get("tDamLow"), item.get("wDamLow"), item.get("fDamLow"), item.get("aDamLow")]);
            stats.set("damageBases", [item.get("nDamBaseLow"),item.get("eDamBaseLow"),item.get("tDamBaseLow"),item.get("wDamBaseLow"),item.get("fDamBaseLow"),item.get("aDamBaseLow")]);
            let resultsLow = calculateSpellDamage(stats, [100, 0, 0, 0, 0, 0], 0, 0, 0, item, [0, 0, 0, 0, 0], 1, undefined);
            let damagesLow = resultsLow[2];
            stats.set("damageRaw", [item.get("nDam"), item.get("eDam"), item.get("tDam"), item.get("wDam"), item.get("fDam"), item.get("aDam")]);
            stats.set("damageBases", [item.get("nDamBaseHigh"),item.get("eDamBaseHigh"),item.get("tDamBaseHigh"),item.get("wDamBaseHigh"),item.get("fDamBaseHigh"),item.get("aDamBaseHigh")]);
            let results = calculateSpellDamage(stats, [100, 0, 0, 0, 0, 0], 0, 0, 0, item, [0, 0, 0, 0, 0], 1, undefined);
            let damages = results[2];
            console.log(damages);
            
            let total_damage_min = 0;
            let total_damage_max = 0;
            for (const i in damage_keys) {
                total_damage_min += damagesLow[i][0] + damagesLow[i][1];
                total_damage_max += damages[i][0] + damages[i][1];
                item.set(damage_keys[i], damagesLow[i][0]+"-"+damagesLow[i][1]+"\u279c"+damages[i][0]+"-"+damages[i][1]);
            }
            total_damage_min = total_damage_min / 2;
            total_damage_max = total_damage_max / 2;
            item.set("basedps", [total_damage_min, total_damage_max]);
        }
    } else if (item.get("category") === "armor") { 
    }

    let display_commands = item_display_commands;

    // Clear the parent div.
    setHTML(parent_id, "");
    let parent_div = document.getElementById(parent_id);
    
    let active_elem;
    let fix_id = item.has("fixID") && item.get("fixID");
    let elemental_format = false;
    for (let i = 0; i < display_commands.length; i++) {
        const command = display_commands[i];
        if (command.charAt(0) === "#") {
            if (command === "#cdiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemcenter');
            }
            else if (command === "#ldiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemleft');
            }
            else if (command === "#table") {
                active_elem = document.createElement('table');
                active_elem.classList.add('itemtable');
            }
            active_elem.style.maxWidth = "100%";
            parent_div.appendChild(active_elem);
        }
        else if (command.charAt(0) === "!") {
            // TODO: This is sooo incredibly janky.....
            if (command === "!elemental") {
                elemental_format = !elemental_format;
            } 
        }
        else {
            let id = command; 
            if(nonRolledIDs.includes(id)){//nonRolledID & non-0/non-null/non-und ID
                if (!item.get(id)) {
                    if (! (item.get("crafted") && skp_order.includes(id) && 
                            (item.get("maxRolls").get(id) || item.get("minRolls").get(id)))) {
                        continue;
                    }
                }
                if (id === "slots") {
                    let p_elem = document.createElement("p");
                    // PROPER POWDER DISPLAYING
                    let numerals = new Map([[1, "I"], [2, "II"], [3, "III"], [4, "IV"], [5, "V"], [6, "VI"]]);

                    let powderPrefix = document.createElement("b");
                    powderPrefix.classList.add("powderLeft"); powderPrefix.classList.add("left");
                    powderPrefix.textContent = "Powder Slots: " + item.get(id) + " [";
                    p_elem.appendChild(powderPrefix);
                    
                    let powders = item.get("powders");
                    for (let i = 0; i < powders.length; i++) {
                        let powder = document.createElement("b");
                        powder.textContent = numerals.get((powders[i]%6)+1)+" ";
                        powder.classList.add(damageClasses[Math.floor(powders[i]/6)+1]+"_powder");
                        p_elem.appendChild(powder);
                    }

                    let powderSuffix = document.createElement("b");
                    powderSuffix.classList.add("powderRight"); powderSuffix.classList.add("left"); 
                    powderSuffix.textContent = "]";
                    p_elem.appendChild(powderSuffix);
                    active_elem.appendChild(p_elem);
                } else if (id === "set") {
                    if (item.get("hideSet")) { continue; }

                    let p_elem = document.createElement("p");
                    p_elem.classList.add("itemp");
                    p_elem.textContent = "Set: " + item.get(id).toString();
                    active_elem.appendChild(p_elem);
                } else if (id === "majorIds") {
                    console.log(item.get(id));
                    for (let majorID of item.get(id)) {
                        let p_elem = document.createElement("p");
                        p_elem.classList.add("itemp");

                        let title_elem = document.createElement("b");
                        let b_elem = document.createElement("b");
                        if (majorID.includes(":")) {   
                            let name = majorID.substring(0, majorID.indexOf(":")+1);
                            let mid = majorID.substring(majorID.indexOf(":")+1);
                            if (name.charAt(0) !== "+") {name = "+" + name}
                            title_elem.classList.add("Legendary");
                            title_elem.textContent = name;
                            b_elem.classList.add("Crafted");
                            b_elem.textContent = mid;
                            p_elem.appendChild(title_elem);
                            p_elem.appendChild(b_elem);
                        } else {
                            let name = item.get(id).toString()
                            if (name.charAt(0) !== "+") {name = "+" + name}
                            b_elem.classList.add("Legendary");
                            b_elem.textContent = name;
                            p_elem.appendChild(b_elem);
                        }
                        active_elem.appendChild(p_elem);
                    }
                } else if (id === "lvl" && item.get("tier") === "Crafted") {
                    let p_elem = document.createElement("p");
                    p_elem.classList.add("itemp");
                    p_elem.textContent = "Combat Level Min: " + item.get("lvlLow") + "-" + item.get(id);
                    active_elem.appendChild(p_elem);
                } else if (id === "displayName") {
                    let p_elem = document.createElement("a");
                    p_elem.classList.add('itemp');
                    p_elem.classList.add("smalltitle");
                    p_elem.classList.add(item.has("tier") ? item.get("tier").replace(" ","") : "none");
                    
                    if (item.get("custom")) {
                        p_elem.href = url_base.replace(/\w+.html/, "") + "customizer.html#" + item.get("hash");
                        p_elem.textContent = item.get("displayName");
                    } else if (item.get("crafted")) {
                        p_elem.href = url_base.replace(/\w+.html/, "") + "crafter.html#" + item.get("hash");
                        p_elem.textContent = item.get(id);
                    } else {
                        p_elem.href = url_base.replace(/\w+.html/, "") + "item.html#" + item.get("displayName");
                        p_elem.textContent = item.get("displayName");
                    }

                    p_elem.target = "_blank";
                    active_elem.appendChild(p_elem);
                    let img = document.createElement("img");
                    if (item && item.has("type")) {
                        img.src = "./media/items/" + (newIcons ? "new/":"old/") + "generic-" + item.get("type") + ".png";
                        img.alt = item.get("type");
                        img.style = " z=index: 1;max-width: 64px; max-height: 64px; position: relative; top: 50%; transform: translateY(-50%);";
                        let bckgrd = document.createElement("p");
                        bckgrd.style = "width: 96px; height: 96px; border-radius: 50%;background-image: radial-gradient(closest-side, " + colorMap.get(item.get("tier")) + " 20%," + "#121516 80%); margin-left: auto; margin-right: auto;"
                        bckgrd.classList.add("center");
                        bckgrd.classList.add("itemp");
                        active_elem.appendChild(bckgrd);
                        bckgrd.appendChild(img);
                    }
                } else {
                    let p_elem;
                    if ( !(item.get("tier") === "Crafted" && item.get("category") === "armor" && id === "hp") && (!skp_order.includes(id)) || (skp_order.includes(id) && item.get("tier") !== "Crafted" && active_elem.nodeName === "DIV") ) { //skp warp
                        p_elem = displayFixedID(active_elem, id, item.get(id), elemental_format);
                    } else if (item.get("tier") === "Crafted" && item.get("category") === "armor" && id === "hp") {
                        p_elem = displayFixedID(active_elem, id, item.get(id+"Low")+"-"+item.get(id), elemental_format);
                    }
                    if (id === "lore") {
                        p_elem.style = "font-style: italic";
                        p_elem.classList.add("lore");
                    } else if (skp_order.includes(id)) { //id = str, dex, int, def, or agi
                        if ( item.get("tier") !== "Crafted" && active_elem.nodeName === "DIV") {
                            p_elem.textContent = "";
                            p_elem.classList.add("itemp");
                            row = document.createElement("p");
                            row.classList.add("left");
                            
                            let title = document.createElement("b");
                            title.textContent = idPrefixes[id] + " ";
                            let boost = document.createElement("b");
                            if (item.get(id) < 0) {
                                boost.classList.add("negative");
                            } else { //boost = 0 SHOULD not come up
                                boost.classList.add("positive");
                            }
                            boost.textContent = item.get(id);
                            row.appendChild(title);
                            row.appendChild(boost);
                            p_elem.appendChild(row);
                        } else if ( item.get("tier") === "Crafted" && active_elem.nodeName === "TABLE") {
                            let row = displayRolledID(item, id, elemental_format);
                            active_elem.appendChild(row);
                        }
                    } else if (id === "restrict") {
                        p_elem.classList.add("restrict");
                    }
                }
            }
            else if ( rolledIDs.includes(id) &&
                        ((item.get("maxRolls") && item.get("maxRolls").get(id))
                        || (item.get("minRolls") && item.get("minRolls").get(id)))) {
                let style = "positive";
                if (item.get("minRolls").get(id) < 0) {
                    style = "negative";
                }
                if(reversedIDs.includes(id)){
                    style === "positive" ? style = "negative" : style = "positive"; 
                }
                if (fix_id) {
                    displayFixedID(active_elem, id, item.get("minRolls").get(id), elemental_format, style);
                }
                else {
                    let row = displayRolledID(item, id, elemental_format);
                    active_elem.appendChild(row);
                }
            }else{
              // :/  
            }
        }
    }
    //Show powder specials ;-;
    let nonConsumables = ["relik", "wand", "bow", "spear", "dagger", "chestplate", "helmet", "leggings", "boots", "ring", "bracelet", "necklace"];
    if(nonConsumables.includes(item.get("type"))) {
        let powder_special = document.createElement("p");
        powder_special.classList.add("left");
        let powders = item.get("powders");
        let element = "";
        let power = 0;
        for (let i = 0; i < powders.length; i++) {
            let firstPowderType = skp_elements[Math.floor(powders[i]/6)];
            if (element !== "") break;
            else if (powders[i]%6 > 2) { //t4+
                for (let j = i+1; j < powders.length; j++) {
                    let currentPowderType = skp_elements[Math.floor(powders[j]/6)]
                    if (powders[j] % 6 > 2 && firstPowderType === currentPowderType) {
                        element = currentPowderType;
                        power = Math.round(((powders[i] % 6 + powders[j] % 6 + 2) / 2 - 4) * 2);
                        break;
                    }
                }
            }
        }
        if (element !== "") {//powder special is "[e,t,w,f,a]+[0,1,2,3,4]"
            let powderSpecial = powderSpecialStats[ skp_elements.indexOf(element)];
            let specialSuffixes = new Map([ ["Duration", " sec"], ["Radius", " blocks"], ["Chains", ""], ["Damage", "%"], ["Damage Boost", "%"], ["Knockback", " blocks"] ]);
            let specialTitle = document.createElement("p");
            let specialEffects = document.createElement("p");
            addClasses(specialTitle, ["left", "itemp", damageClasses[skp_elements.indexOf(element) + 1]]);
            addClasses(specialEffects, ["left", "itemp", "nocolor"]);
            let effects;
            if (item.get("category") === "weapon") {//weapon
                effects = powderSpecial["weaponSpecialEffects"];
                specialTitle.textContent = powderSpecial["weaponSpecialName"];
            }else if (item.get("category") === "armor") {//armor
                effects = powderSpecial["armorSpecialEffects"];
                specialTitle.textContent += powderSpecial["armorSpecialName"] + ": ";
            }
            for (const [key,value] of effects.entries()) {
                if (key !== "Description") {
                    let effect = document.createElement("p");
                    effect.classList.add("itemp");
                    effect.textContent = key + ": " + value[power] + specialSuffixes.get(key);
                    if(key === "Damage"){
                        effect.textContent += elementIcons[skp_elements.indexOf(element)];
                    }
                    if (element === "w" && item.get("category") === "armor") {
                        effect.textContent += " / Mana Used";
                    }
                    specialEffects.appendChild(effect);
                }else{
                    specialTitle.textContent += "[ " + effects.get("Description") + " ]"; 
                }
            }
            powder_special.appendChild(specialTitle);
            powder_special.appendChild(specialEffects);
            parent_div.appendChild(powder_special);
        }
    }
    
    if(item.get("tier") && item.get("tier") === "Crafted") {
        let dura_elem = document.createElement("p");
        dura_elem.classList.add("itemp");
        let dura = [];
        let suffix = "";
        if(nonConsumables.includes(item.get("type"))) {
            dura = item.get("durability");
            dura_elem.textContent = "Durability: "
        } else {
            dura = item.get("duration");
            dura_elem.textContent = "Duration: "
            suffix = " sec."
            let charges = document.createElement("b");
            charges.textContent = "Charges: " + item.get("charges");
            charges.classList.add("spaceleft");
            active_elem.appendChild(charges);
        }

        if (typeof(dura) === "string") {
            dura_elem.textContent += dura + suffix;
        } else {
            dura_elem.textContent += dura[0]+"-"+dura[1] + suffix;
        }
        active_elem.append(dura_elem);

    }
    //Show item tier
    if (item.get("tier") && item.get("tier") !== " ") {
        let item_desc_elem = document.createElement("p");
        item_desc_elem.classList.add('itemp');
        item_desc_elem.classList.add(item.get("tier"));
        item_desc_elem.textContent = item.get("tier")+" "+item.get("type");
        active_elem.append(item_desc_elem);
    }

    //Show item hash if applicable
    if (item.get("crafted") || item.get("custom")) {
        let item_desc_elem = document.createElement("p");
        item_desc_elem.classList.add('itemp');
        item_desc_elem.style.maxWidth = "100%";
        item_desc_elem.style.wordWrap = "break-word";
        item_desc_elem.style.wordBreak = "break-word";
        item_desc_elem.textContent = item.get("hash");
        active_elem.append(item_desc_elem);
    }

    if (item.get("category") === "weapon") { 
        let damage_mult = baseDamageMultiplier[attackSpeeds.indexOf(item.get("atkSpd"))];
        let total_damages = item.get("basedps");
        let base_dps_elem = document.createElement("p");
        base_dps_elem.classList.add("left");
        base_dps_elem.classList.add("itemp");
        if (item.get("tier") === "Crafted") {
            let base_dps_min = total_damages[0] * damage_mult;
            let base_dps_max = total_damages[1] * damage_mult;

            base_dps_elem.textContent = "Base DPS: "+base_dps_min.toFixed(3)+"\u279c"+base_dps_max.toFixed(3);
        }
        else {
            base_dps_elem.textContent = "Base DPS: "+(total_damages * damage_mult);
        }
        parent_div.appendChild(document.createElement("p"));
        parent_div.appendChild(base_dps_elem);
    }
}

/*  Displays stats about a recipe that are NOT displayed in the craft stats. 
*   Includes: mat name and amounts
*             ingred names in an "array" with ingred effectiveness
*/
function displayRecipeStats(craft, parent_id) {
    let elem = document.getElementById(parent_id);
    elem.textContent = "";
    recipe = craft["recipe"];
    mat_tiers = craft["mat_tiers"];
    ingreds = [];
    for (const n of craft["ingreds"]) {
        ingreds.push(n.get("name"));
    }
    let effectiveness = craft["statMap"].get("ingredEffectiveness");

    let ldiv = document.createElement("div");
    ldiv.classList.add("itemleft");
    let title = document.createElement("p");
    title.classList.add("smalltitle");
    title.textContent = "Recipe Stats";
    ldiv.appendChild(title);
    let mats = document.createElement("p");
    mats.classList.add("itemp");
    mats.textContent = "Crafting Materials: ";
    for (let i = 0; i < 2; i++) {
        let tier = mat_tiers[i];
        let row = document.createElement("p");
        row.classList.add("left");
        let b = document.createElement("b");
        let mat = recipe.get("materials")[i];
        b.textContent = "- " + mat.get("amount") + "x " + mat.get("item").split(" ").slice(1).join(" ");
        b.classList.add("space");
        let starsB = document.createElement("b");
        starsB.classList.add("T1-bracket");
        starsB.textContent = "[";
        row.appendChild(b);
        row.appendChild(starsB);
        for(let j = 0; j < 3; j ++) {
            let star = document.createElement("b");
            star.textContent = "\u272B";
            if(j < tier) {
                star.classList.add("T1");
            } else {
                star.classList.add("T0");
            }
            row.append(star);
        }
        let starsE = document.createElement("b");
        starsE.classList.add("T1-bracket");
        starsE.textContent = "]";
        row.appendChild(starsE);
        mats.appendChild(row);
    }
    ldiv.appendChild(mats);

    let ingredTable = document.createElement("table");
    ingredTable.classList.add("itemtable");
    ingredTable.classList.add("ingredTable");
    for (let i = 0; i < 3; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 2; j++) {
            let ingredName = ingreds[2 * i + j];
            let cell = document.createElement("td");
            cell.style.minWidth = "50%";
            cell.classList.add("center");
            cell.classList.add("box");
            cell.classList.add("tooltip");
            let b = document.createElement("b");
            b.textContent = ingredName;
            b.classList.add("space");
            let eff = document.createElement("b");
            let e = effectiveness[2 * i + j];
            if (e > 0) {
                eff.classList.add("positive");
            } else if (e < 0) {
                eff.classList.add("negative");
            }
            eff.textContent = "[" + e + "%]";
            cell.appendChild(b);
            cell.appendChild(eff);
            row.appendChild(cell);

            let tooltip = document.createElement("div");
            tooltip.classList.add("tooltiptext");
            tooltip.classList.add("ing-tooltip");
            tooltip.classList.add("center");
            tooltip.id = "tooltip-" + (2*i + j);
            cell.appendChild(tooltip);
        }
        ingredTable.appendChild(row);
    }
    elem.appendChild(ldiv);
    elem.appendChild(ingredTable);
}

//Displays a craft. If things change, this function should be modified.
function displayCraftStats(craft, parent_id) {
    let mock_item = craft.statMap;
    displayExpandedItem(mock_item,parent_id);
}

//Displays an ingredient in item format. However, an ingredient is too far from a normal item to display as one.
function displayExpandedIngredient(ingred, parent_id) {
    let parent_elem = document.getElementById(parent_id);
    parent_elem.textContent = "";
    let display_order = [
        "#cdiv",
        "displayName", //tier will be displayed w/ name
        "#table",
        "ids",
        "#ldiv",
        "posMods",
        "itemIDs",
        "consumableIDs",
        "#ldiv",
        "lvl",
        "skills",
    ]
    let item_order = [
        "dura",
        "strReq",
        "dexReq",
        "intReq",
        "defReq",
        "agiReq"
    ]
    let consumable_order = [
        "dura",
        "charges"
    ]
    let posMods_order = [
        "above",
        "under",
        "left",
        "right",
        "touching",
        "notTouching"
    ];
    let id_display_order = [ 
        "eDefPct", 
        "tDefPct", 
        "wDefPct", 
        "fDefPct", 
        "aDefPct", 
        "eDamPct", 
        "tDamPct", 
        "wDamPct", 
        "fDamPct", 
        "aDamPct", 
        "str", 
        "dex", 
        "int", 
        "agi", 
        "def",
        "hpBonus",
        "mr", 
        "ms", 
        "ls",
        "hprRaw", 
        "hprPct", 
        "sdRaw", 
        "sdPct", 
        "mdRaw", 
        "mdPct",  
        "xpb",
        "lb", 
        "lq", 
        "ref",  
        "thorns", 
        "expd", 
        "spd", 
        "atkTier", 
        "poison",  
        "spRegen", 
        "eSteal", 
        "spRaw1",
        "spRaw2", 
        "spRaw3", 
        "spRaw4", 
        "spPct1", 
        "spPct2", 
        "spPct3", 
        "spPct4",
        "jh", 
        "sprint", 
        "sprintReg", 
        "gXp", 
        "gSpd",
    ];
    let active_elem;
    let elemental_format = false;
    let style;
    for (const command of display_order) {
        if (command.charAt(0) === "#") {
            if (command === "#cdiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemcenter');
            }
            else if (command === "#ldiv") {
                active_elem = document.createElement('div');
                active_elem.classList.add('itemleft');
            }
            else if (command === "#table") {
                active_elem = document.createElement('table');
                active_elem.classList.add('itemtable');
            }
            parent_elem.appendChild(active_elem);
        }else {
            let p_elem =  document.createElement("p");
            p_elem.classList.add("left");
            if (command === "displayName") {
                p_elem.classList.add("title");
                p_elem.classList.remove("left");
                let title_elem = document.createElement("b");
                title_elem.textContent = ingred.get("displayName");
                p_elem.appendChild(title_elem);

                let space = document.createElement("b");
                space.classList.add("space");
                p_elem.appendChild(space);

                let tier = ingred.get("tier"); //tier in [0,3]
                let begin = document.createElement("b");
                begin.classList.add("T"+tier+"-bracket");
                begin.textContent = "[";
                p_elem.appendChild(begin);

                for (let i = 0; i < 3; i++) {
                    let tier_elem = document.createElement("b");
                    if(i < tier) {tier_elem.classList.add("T"+tier)}
                    else {tier_elem.classList.add("T0")}
                    tier_elem.textContent = "\u272B";
                    p_elem.appendChild(tier_elem);
                }
                let end = document.createElement("b");
                end.classList.add("T"+tier+"-bracket");
                end.textContent = "]";
                p_elem.appendChild(end);
            }else if (command === "lvl") {
                p_elem.textContent = "Crafting Lvl Min: " + ingred.get("lvl");
            }else if (command === "posMods") {
                for (const [key,value] of ingred.get("posMods")) {
                    let p = document.createElement("p");
                    p.classList.add("nomarginp");
                    if (value != 0) {
                        let title = document.createElement("b");
                        title.textContent = posModPrefixes[key];
                        let val = document.createElement("b");
                        val.textContent = value + posModSuffixes[key];
                        if(value > 0) {
                            val.classList.add("positive");
                        } else {
                            val.classList.add("negative");
                        }
                        p.appendChild(title);
                        p.appendChild(val);
                        p_elem.appendChild(p);
                    }
                }
            } else if (command === "itemIDs") { //dura, reqs
                for (const [key,value] of ingred.get("itemIDs")) {
                    let p = document.createElement("p");
                    p.classList.add("nomarginp");                        
                    if (value != 0) {
                        let title = document.createElement("b");
                        title.textContent = itemIDPrefixes[key];
                        p.appendChild(title);
                    }
                    let desc = document.createElement("b");
                    if(value > 0) {
                        if(key !== "dura") {
                            desc.classList.add("negative");
                        } else{
                            desc.classList.add("positive");
                        }
                        desc.textContent = "+"+value;
                    } else if (value < 0){
                        if(key !== "dura") {
                            desc.classList.add("positive");
                        } else{
                            desc.classList.add("negative");
                        }
                        desc.textContent = value; 
                    }
                    if(value != 0){
                        p.appendChild(desc);
                    }
                    p_elem.append(p);
                }
            } else if (command === "consumableIDs") { //dura, charges
                for (const [key,value] of ingred.get("consumableIDs")) {
                    let p = document.createElement("p");
                    p.classList.add("nomarginp");                        
                    if (value != 0) {
                        let title = document.createElement("b");
                        title.textContent = consumableIDPrefixes[key];
                        p.appendChild(title);
                    }
                    let desc = document.createElement("b");
                    if(value > 0) {
                        desc.classList.add("positive");
                        desc.textContent = "+"+value;
                    } else if (value < 0){
                        desc.classList.add("negative");
                        desc.textContent = value; 
                    }
                    if(value != 0){
                        p.appendChild(desc);
                        let suffix = document.createElement("b");
                        suffix.textContent = consumableIDSuffixes[key];
                        p.appendChild(suffix);
                    }
                    p_elem.append(p);
                }
            }else if (command === "skills") {
                p_elem.textContent = "Used in:";
                for(const skill of ingred.get("skills")) {
                    let p = document.createElement("p");
                    p.textContent = skill.charAt(0) + skill.substring(1).toLowerCase();
                    p.classList.add("left");
                    p_elem.append(p);
                }
            } else if (command === "ids") { //warp
                for (let [key,value] of ingred.get("ids").get("maxRolls")) {
                    if (value !== undefined && value != 0) {
                        let row = displayRolledID(ingred.get("ids"), key, false, "auto");
                        active_elem.appendChild(row);
                    }
                }
            } else {//this shouldn't be happening        
            }

            active_elem.appendChild(p_elem);
        }
    }    
}

function displayNextCosts(parent_id, build) { 
    let p_elem = document.getElementById(parent_id);
    let int = build.total_skillpoints[2];
    let spells = spell_table[build.weapon.get("type")];

    p_elem.textContent = "";
    
    let title = document.createElement("p");
    title.classList.add("title");
    title.classList.add("Normal");
    title.textContent = "Next Spell Costs";
    
    let int_title = document.createElement("p");
    int_title.classList.add("itemp");
    int_title.textContent = int + " Intelligence points.";

    p_elem.append(title);
    p_elem.append(int_title);

    for (const spell of spells) { 
        let spellp = document.createElement("p");
        let spelltitle = document.createElement("p");
        spelltitle.classList.add("itemp");
        spelltitle.textContent = spell.title;
        spellp.appendChild(spelltitle);
        let row = document.createElement("p");
        row.classList.add("itemp");
        let init_cost = document.createElement("b");
        init_cost.textContent = build.getSpellCost(spells.indexOf(spell) + 1, spell.cost);
        init_cost.classList.add("Mana");
        let arrow = document.createElement("b");
        arrow.textContent = "\u279C";
        let next_cost = document.createElement("b");
        next_cost.textContent = (init_cost.textContent === "1" ? 1 : build.getSpellCost(spells.indexOf(spell) + 1, spell.cost) - 1);
        next_cost.classList.add("Mana");
        let int_needed = document.createElement("b");
        if (init_cost.textContent === "1") {
            int_needed.textContent = ": n/a (+0)";
        }else { //do math
            let target = build.getSpellCost(spells.indexOf(spell) + 1, spell.cost) - 1;
            let needed = int;
            let noUpdate = false;
            //forgive me... I couldn't inverse ceil, floor, and max.
            while (build.getSpellCost(spells.indexOf(spell) + 1, spell.cost) > target) {
                if(needed > 150) {
                    noUpdate = true;
                    break;
                }
                needed++;
                build.total_skillpoints[2] = needed;
            }
            let missing = needed - int;  
            //in rare circumstances, the next spell cost can jump.
            if (noUpdate) {
                next_cost.textContent = (init_cost.textContent === "1" ? 1 : build.getSpellCost(spells.indexOf(spell) + 1, spell.cost)-1); 
            }else {
                next_cost.textContent = (init_cost.textContent === "1" ? 1 : build.getSpellCost(spells.indexOf(spell) + 1, spell.cost)); 
            }
            
            
            build.total_skillpoints[2] = int;//forgive me pt 2
            int_needed.textContent = ": " + (needed > 150 ? ">150" : needed) + " int (+" + (needed > 150 ? "n/a" : missing) + ")"; 
        }
        
        row.appendChild(init_cost);
        row.appendChild(arrow);
        row.appendChild(next_cost);
        row.appendChild(int_needed);
        spellp.appendChild(row);

        p_elem.append(spellp);
    }
}

function displayRolledID(item, id, elemental_format) {
    let row = document.createElement('tr');
    let min_elem = document.createElement('td');
    min_elem.classList.add('left');
    let id_min = item.get("minRolls").get(id)
    let style = id_min < 0 ? "negative" : "positive";
    if(reversedIDs.includes(id)){
        style === "positive" ? style = "negative" : style = "positive"; 
    }
    min_elem.classList.add(style);
    min_elem.textContent = id_min + idSuffixes[id];
    row.appendChild(min_elem);

    let desc_elem = document.createElement('td');
    desc_elem.classList.add('center');
    //TODO elemental format jank
    if (elemental_format) {
        apply_elemental_format(desc_elem, id);
    }
    else {
        desc_elem.textContent = idPrefixes[id];
    }
    row.appendChild(desc_elem);

    let max_elem = document.createElement('td');
    let id_max = item.get("maxRolls").get(id)
    max_elem.classList.add('right');
    style = id_max < 0 ? "negative" : "positive";
    if(reversedIDs.includes(id)){
        style === "positive" ? style = "negative" : style = "positive"; 
    }
    max_elem.classList.add(style);
    max_elem.textContent = id_max + idSuffixes[id];
    row.appendChild(max_elem);
    return row;
}

function displayFixedID(active, id, value, elemental_format, style) {
    if (style) {
        let row = document.createElement('tr');
        let desc_elem = document.createElement('td');
        desc_elem.classList.add('left');
        if (elemental_format) {
            apply_elemental_format(desc_elem, id);
        }
        else {
            desc_elem.textContent = idPrefixes[id];
        }
        row.appendChild(desc_elem);

        let value_elem = document.createElement('td');
        value_elem.classList.add('right');
        value_elem.classList.add(style);
        value_elem.textContent = value + idSuffixes[id];
        row.appendChild(value_elem);
        active.appendChild(row);
        return row;
    }
    else {
        // HACK TO AVOID DISPLAYING ZERO DAMAGE! TODO
        if (value === "0-0" || value === "0-0\u279c0-0") {
            return;
        }
        let p_elem = document.createElement('p');
        p_elem.classList.add('itemp');
        if (elemental_format) {
            apply_elemental_format(p_elem, id, value);
        }
        else {
            p_elem.textContent = idPrefixes[id].concat(value, idSuffixes[id]);
        }
        active.appendChild(p_elem);
        return p_elem;
    }
}
function displayEquipOrder(parent_elem,buildOrder){
    parent_elem.textContent = "";
    const order = buildOrder.slice();
    let title_elem = document.createElement("p");
    title_elem.textContent = "Equip order ";
    title_elem.classList.add("title");
    title_elem.classList.add("Normal");
    title_elem.classList.add("itemp");
    parent_elem.append(title_elem);
    parent_elem.append(document.createElement("br"));
    for (const item of order) {
        let p_elem = document.createElement("p");
        p_elem.classList.add("itemp");
        p_elem.classList.add("left");
        p_elem.textContent = item.get("displayName");
        parent_elem.append(p_elem);
    }
}

function displayPoisonDamage(overallparent_elem, build) {
    overallparent_elem.textContent = "";

    //Title
    let title_elemavg = document.createElement("p");
    title_elemavg.classList.add("smalltitle");
    title_elemavg.classList.add("Normal");
    title_elemavg.textContent = "Poison Stats";
    overallparent_elem.append(title_elemavg);

    let overallpoisonDamage = document.createElement("p");
    overallpoisonDamage.classList.add("lessbottom");
    let overallpoisonDamageFirst = document.createElement("b");
    let overallpoisonDamageSecond = document.createElement("b");
    let poison_tick = Math.ceil(build.statMap.get("poison") * (1+skillPointsToPercentage(build.total_skillpoints[0])) * (build.statMap.get("poisonPct") + build.externalStats.get("poisonPct"))/100 /3);
    overallpoisonDamageFirst.textContent = "Poison Tick: ";
    overallpoisonDamageSecond.textContent = Math.max(poison_tick,0);
    overallpoisonDamageSecond.classList.add("Damage");

    overallpoisonDamage.appendChild(overallpoisonDamageFirst);
    overallpoisonDamage.appendChild(overallpoisonDamageSecond);
    overallparent_elem.append(overallpoisonDamage);
}

function displayMeleeDamage(parent_elem, overallparent_elem, meleeStats){
    console.log("Melee Stats");
    console.log(meleeStats);
    let tooltipinfo = meleeStats[13];
    let attackSpeeds = ["Super Slow", "Very Slow", "Slow", "Normal", "Fast", "Very Fast", "Super Fast"];
    //let damagePrefixes = ["Neutral Damage: ","Earth Damage: ","Thunder Damage: ","Water Damage: ","Fire Damage: ","Air Damage: "];
    parent_elem.textContent = "";
    overallparent_elem.textContent = "";
    const stats = meleeStats.slice();
    
    for (let i = 0; i < 6; ++i) {
        for (let j in stats[i]) {
            stats[i][j] = stats[i][j].toFixed(2);
        }
    }
    for (let i = 6; i < 8; ++i) {
        for (let j = 0; j < 2; j++) {
            stats[i][j] = stats[i][j].toFixed(2);
        }
    }
    for (let i = 8; i < 11; ++i){
        stats[i] = stats[i].toFixed(2);
    }
    //tooltipelem, tooltiptext
    let tooltip; let tooltiptext;
    
    //title
    let title_elem = document.createElement("p");
    title_elem.classList.add("title");
    title_elem.classList.add("Normal");
    title_elem.classList.add("itemp");
    title_elem.textContent = "Melee Stats";
    parent_elem.append(title_elem);
    parent_elem.append(document.createElement("br"));

    //overall title
    let title_elemavg = document.createElement("p");
    title_elemavg.classList.add("smalltitle");
    title_elemavg.classList.add("Normal");
    title_elemavg.textContent = "Melee Stats";
    overallparent_elem.append(title_elemavg);
    
    //average DPS
    let averageDamage = document.createElement("p");
    averageDamage.classList.add("left");
    averageDamage.classList.add("itemp");
    averageDamage.classList.add("tooltip");
    averageDamage.textContent = "Average DPS: " + stats[10];
    tooltiptext = `= ((${stats[8]} * ${(stats[6][2]).toFixed(2)}) + (${stats[9]} * ${(stats[7][2]).toFixed(2)}))`
    tooltip = createTooltip(tooltip, "p", tooltiptext, averageDamage, ["melee-tooltip"]);
    averageDamage.appendChild(tooltip);
    parent_elem.append(averageDamage);

    //overall average DPS
    let overallaverageDamage = document.createElement("p");
    overallaverageDamage.classList.add("itemp");
    let overallaverageDamageFirst = document.createElement("b");
    overallaverageDamageFirst.textContent = "Average DPS: "

    let overallaverageDamageSecond = document.createElement("b");
    overallaverageDamageSecond.classList.add("Damage");
    overallaverageDamageSecond.textContent = stats[10];
    tooltip = createTooltip(tooltip, "p", tooltiptext, overallaverageDamage, ["melee-tooltip", "summary-tooltip"]);
    overallaverageDamage.appendChild(overallaverageDamageFirst);
    overallaverageDamage.appendChild(overallaverageDamageSecond);

    overallparent_elem.append(overallaverageDamage);
    //overallparent_elem.append(document.createElement("br"));

    //attack speed
    let atkSpd = document.createElement("p");
    atkSpd.classList.add("left");
    atkSpd.classList.add("itemp");
    atkSpd.textContent = "Attack Speed: " + attackSpeeds[stats[11]];
    parent_elem.append(atkSpd);
    parent_elem.append(document.createElement("br"));

    //overall attack speed
    let overallatkSpd = document.createElement("p");
    overallatkSpd.classList.add("center");
    overallatkSpd.classList.add("itemp");
    let overallatkSpdFirst = document.createElement("b");
    overallatkSpdFirst.textContent = "Attack Speed: ";
    let overallatkSpdSecond = document.createElement("b");
    overallatkSpdSecond.classList.add("Damage");
    overallatkSpdSecond.textContent =  attackSpeeds[stats[11]];
    overallatkSpd.appendChild(overallatkSpdFirst);
    overallatkSpd.appendChild(overallatkSpdSecond);
    overallparent_elem.append(overallatkSpd);

    //Non-Crit: n->elem, total dmg, DPS
    let nonCritStats = document.createElement("p");
    nonCritStats.classList.add("left");
    nonCritStats.classList.add("itemp");
    nonCritStats.textContent = "Non-Crit Stats: ";
    nonCritStats.append(document.createElement("br"));
    for (let i = 0; i < 6; i++){
        if(stats[i][1] != 0){
            let dmg = document.createElement("p");
            dmg.textContent = stats[i][0] + " \u2013 " + stats[i][1];
            dmg.classList.add(damageClasses[i]);
            dmg.classList.add("itemp");
            tooltiptext = tooltipinfo.get("damageformulas")[i].slice(0,2).join("\n");
            tooltip = createTooltip(tooltip, "p", tooltiptext, dmg, ["melee-tooltip"]);
            nonCritStats.append(dmg);
        }
    }

    let normalDamage = document.createElement("p");
    normalDamage.textContent = "Total: " + stats[6][0] + " \u2013 " + stats[6][1];
    normalDamage.classList.add("itemp");
    let tooltiparr = ["Min: = ", "Max: = "]
    let arr = []; let arr2 = [];
    for (let i = 0; i < 6; i++) {
        if (stats[i][0] != 0) {
            arr.push(stats[i][0]);
            arr2.push(stats[i][1]);
        }
    }
    tooltiptext = tooltiparr[0] + arr.join(" + ") + "\n" + tooltiparr[1] + arr2.join(" + ");
    tooltip = createTooltip(tooltip, "p", tooltiptext, normalDamage, ["melee-tooltip"]);
    nonCritStats.append(normalDamage);

    let normalDPS = document.createElement("p");
    normalDPS.textContent = "Normal DPS: " + stats[8];
    normalDPS.classList.add("itemp");
    normalDPS.classList.add("tooltip");
    tooltiptext = ` = ((${stats[6][0]} + ${stats[6][1]}) / 2) * ${baseDamageMultiplier[stats[11]]}`;
    tooltip = createTooltip(tooltip, "p", tooltiptext, normalDPS, ["melee-tooltip"]);
    nonCritStats.append(normalDPS);

    //overall average DPS
    let singleHitDamage = document.createElement("p");
    singleHitDamage.classList.add("itemp");
    let singleHitDamageFirst = document.createElement("b");
    singleHitDamageFirst.textContent = "Single Hit Average: ";
    let singleHitDamageSecond = document.createElement("b");
    singleHitDamageSecond.classList.add("Damage");
    singleHitDamageSecond.textContent = stats[12].toFixed(2);
    tooltiptext = ` = ((${stats[6][0]} + ${stats[6][1]}) / 2) * ${stats[6][2].toFixed(2)} + ((${stats[7][0]} + ${stats[7][1]}) / 2) * ${stats[7][2].toFixed(2)}`;
    tooltip = createTooltip(tooltip, "p", tooltiptext, singleHitDamage, ["melee-tooltip", "summary-tooltip"]);

    singleHitDamage.appendChild(singleHitDamageFirst);
    singleHitDamage.appendChild(singleHitDamageSecond);
    overallparent_elem.append(singleHitDamage);
    
    let normalChance = document.createElement("p");
    normalChance.textContent = "Non-Crit Chance: " + (stats[6][2]*100).toFixed(2) + "%"; 
    normalChance.classList.add("itemp");
    normalChance.append(document.createElement("br"));
    normalChance.append(document.createElement("br"));
    nonCritStats.append(normalChance);

    parent_elem.append(nonCritStats);
    parent_elem.append(document.createElement("br"));

    //Crit: n->elem, total dmg, DPS
    let critStats = document.createElement("p");
    critStats.classList.add("left");
    critStats.classList.add("itemp");
    critStats.textContent = "Crit Stats: ";
    critStats.append(document.createElement("br"));
    for (let i = 0; i < 6; i++){
        if(stats[i][3] != 0) {
            dmg = document.createElement("p");
            dmg.textContent = stats[i][2] + " \u2013 " + stats[i][3];
            dmg.classList.add(damageClasses[i]);
            dmg.classList.add("itemp");
            tooltiptext = tooltipinfo.get("damageformulas")[i].slice(2,4).join("\n");
            tooltip = createTooltip(tooltip, "p", tooltiptext, dmg, ["melee-tooltip"]);
            critStats.append(dmg);
        }
    }
    let critDamage = document.createElement("p");
    critDamage.textContent = "Total: " + stats[7][0] + " \u2013 " + stats[7][1];
    critDamage.classList.add("itemp");
    tooltiparr = ["Min: = ", "Max: = "]
    arr = []; arr2 = [];
    for (let i = 0; i < 6; i++) {
        if (stats[i][0] != 0) {
            arr.push(stats[i][2]);
            arr2.push(stats[i][3]);
        }
    }
    tooltiptext = tooltiparr[0] + arr.join(" + ") + "\n" + tooltiparr[1] + arr2.join(" + ");
    tooltip = createTooltip(tooltip, "p", tooltiptext, critDamage, ["melee-tooltip"]);
    
    critStats.append(critDamage);

    let critDPS = document.createElement("p");
    critDPS.textContent = "Crit DPS: " + stats[9];
    critDPS.classList.add("itemp");
    tooltiptext = ` = ((${stats[7][0]} + ${stats[7][1]}) / 2) * ${baseDamageMultiplier[stats[11]]}`;
    tooltip = createTooltip(tooltip, "p", tooltiptext, critDPS, ["melee-tooltip"]);
    critStats.append(critDPS);

    let critChance = document.createElement("p");
    critChance.textContent = "Crit Chance: " + (stats[7][2]*100).toFixed(2) + "%";
    critChance.classList.add("itemp");
    critChance.append(document.createElement("br"));
    critChance.append(document.createElement("br"));
    critStats.append(critChance);

    parent_elem.append(critStats);
}

function displayDefenseStats(parent_elem, build, insertSummary){
    let defenseStats = build.getDefenseStats();
    insertSummary = (typeof insertSummary !== 'undefined') ? insertSummary : false;
    if (!insertSummary) {
        parent_elem.textContent = "";
    }
    const stats = defenseStats.slice();    

    if (!insertSummary) {
        let title_elem = document.createElement("p");
        title_elem.textContent = "Defense Stats";
        title_elem.classList.add("title");
        title_elem.classList.add("Normal");
        title_elem.classList.add("itemp");
        parent_elem.append(title_elem);

        let base_stat_elem = document.createElement("p");
        base_stat_elem.id = "base-stat";
        parent_elem.append(base_stat_elem);

        let mock_item = new Map();

        mock_item.set("fixID", true);
        let mock_minRolls = new Map();
        mock_item.set("minRolls", mock_minRolls);
        const stats = ["hp", "hpBonus", "hprRaw", "hprPct", "fDef", "wDef", "aDef", "tDef", "eDef",
                        "fDefPct", "wDefPct", "aDefPct", "tDefPct", "eDefPct"];
        for (const stat of stats) {
            if (rolledIDs.includes(stat)) {
                mock_minRolls.set(stat, build.statMap.get(stat));
            }
            else {
                mock_item.set(stat, build.statMap.get(stat));
            }
        }
        mock_item.set("powders", []);
        displayExpandedItem(mock_item, base_stat_elem.id);
    }

    parent_elem.append(document.createElement("br"));
    let statsTable = document.createElement("table");
    statsTable.classList.add("itemtable");

    //[total hp, ehp, total hpr, ehpr, [def%, agi%], [edef,tdef,wdef,fdef,adef]]
    for(const i in stats){
        if(typeof stats[i] === "number"){
            stats[i] = stats[i].toFixed(2);
        }else{
            for(const j in stats[i]){
                stats[i][j] = stats[i][j].toFixed(2);
            }
        }
    }
    
    //total HP
    let hpRow = document.createElement("tr");
    let hp = document.createElement("td");
    hp.classList.add("Health");
    hp.classList.add("left");
    hp.textContent = "Total HP:";  
    let boost = document.createElement("td");
    boost.textContent = stats[0];
    boost.classList.add("right");
    
    hpRow.appendChild(hp);
    hpRow.append(boost);
    statsTable.appendChild(hpRow);

    let tooltip; let tooltiptext;

    let defMult = build.statMap.get("defMult");
    if (!defMult) {defMult = 1}

    //EHP
    let ehpRow = document.createElement("tr");
    let ehp = document.createElement("td");
    ehp.classList.add("left");
    ehp.textContent = "Effective HP:";

    boost = document.createElement("td");
    boost.textContent = stats[1][0];
    boost.classList.add("right");
    tooltiptext = `= ${stats[0]} / ((1 - ${skillPointsToPercentage(build.total_skillpoints[3]).toFixed(3)}) * (1 - ${skillPointsToPercentage(build.total_skillpoints[4]).toFixed(3)}) * (2 - ${defMult}) * (2 - ${build.defenseMultiplier}))`
    tooltip = createTooltip(tooltip, "p", tooltiptext, boost, ["def-tooltip"]);

    ehpRow.appendChild(ehp);
    ehpRow.append(boost);
    statsTable.append(ehpRow);

    ehpRow = document.createElement("tr");
    ehp = document.createElement("td");
    ehp.classList.add("left");
    ehp.textContent = "Effective HP (no agi):";

    boost = document.createElement("td");
    boost.textContent = stats[1][1];
    boost.classList.add("right");
    tooltiptext = `= ${stats[0]} / ((1 - ${skillPointsToPercentage(build.total_skillpoints[3]).toFixed(3)}) * (2 - ${defMult}) * (2 - ${build.defenseMultiplier}))`
    tooltip = createTooltip(tooltip, "p", tooltiptext, boost, ["def-tooltip"]);

    ehpRow.appendChild(ehp);
    ehpRow.append(boost);
    statsTable.append(ehpRow);

    //total HPR
    let hprRow = document.createElement("tr");
    let hpr = document.createElement("td");
    hpr.classList.add("Health");
    hpr.classList.add("left");
    hpr.textContent = "HP Regen (Total):";
    boost = document.createElement("td");
    boost.textContent = stats[2];
    boost.classList.add("right");

    hprRow.appendChild(hpr);
    hprRow.appendChild(boost);
    statsTable.appendChild(hprRow);
    //EHPR
    let ehprRow = document.createElement("tr");
    let ehpr = document.createElement("td");
    ehpr.classList.add("left");
    ehpr.textContent = "Effective HP Regen:";

    boost = document.createElement("td");
    boost.textContent = stats[3][0];
    boost.classList.add("right");
    tooltiptext = `= ${stats[2]} / ((1 - ${skillPointsToPercentage(build.total_skillpoints[3]).toFixed(3)}) * (1 - ${skillPointsToPercentage(build.total_skillpoints[4]).toFixed(3)}) * (2 - ${defMult}) * (2 - ${build.defenseMultiplier}))`
    tooltip = createTooltip(tooltip, "p", tooltiptext, boost, ["def-tooltip"]);

    ehprRow.appendChild(ehpr);
    ehprRow.append(boost);
    statsTable.append(ehprRow);
    /*
    ehprRow = document.createElement("tr");
    ehpr = document.createElement("td");
    ehpr.classList.add("left");
    ehpr.textContent = "Effective HP Regen (no agi):";

    boost = document.createElement("td");
    boost.textContent = stats[3][1];
    boost.classList.add("right");

    ehprRow.appendChild(ehpr);
    ehprRow.append(boost);
    statsTable.append(ehprRow); */

    //eledefs
    let eledefs = stats[5];
    for (let i = 0; i < eledefs.length; i++){
        let eledefElemRow = document.createElement("tr");

        let eledef = document.createElement("td");
        eledef.classList.add("left")
        let eledefTitle = document.createElement("b");
        eledefTitle.textContent = damageClasses[i+1];
        eledefTitle.classList.add(damageClasses[i+1]);

        let defense = document.createElement("b");
        defense.textContent = " Def (Total): ";

        eledef.appendChild(eledefTitle);
        eledef.appendChild(defense);
        eledefElemRow.appendChild(eledef);

        let boost = document.createElement("td");
        boost.textContent = eledefs[i];
        boost.classList.add(eledefs[i] >= 0 ? "positive" : "negative");
        boost.classList.add("right");

        let defRaw = build.statMap.get("defRaw")[i];
        let defPct = build.statMap.get("defBonus")[i]/100;
        if (defRaw < 0) {
            defPct >= 0 ? defPct = "- " + defPct: defPct = "+ " + defPct;
            tooltiptext = `= min(0, ${defRaw} * (1 ${defPct}))`
        } else {
            defPct >= 0 ? defPct = "+ " + defPct: defPct = "- " + defPct;
            tooltiptext = `= ${defRaw} * (1 ${defPct})`
        }
        tooltip = createTooltip(tooltip, "p", tooltiptext, boost, ["def-tooltip"]);

        eledefElemRow.appendChild(boost);

        statsTable.appendChild(eledefElemRow);
    }

    if (!insertSummary) {
        //skp
        let defRow = document.createElement("tr");
        let defElem = document.createElement("td");
        defElem.classList.add("left");
        defElem.textContent = "Damage Absorbed %:";
        boost = document.createElement("td");
        boost.classList.add("right");
        boost.textContent = stats[4][0] + "%";
        defRow.appendChild(defElem);
        defRow.appendChild(boost);
        statsTable.append(defRow);

        let agiRow = document.createElement("tr");
        let agiElem = document.createElement("td");
        agiElem.classList.add("left");
        agiElem.textContent = "Dodge Chance %:";
        boost = document.createElement("td");
        boost.classList.add("right");
        boost.textContent = stats[4][1] + "%";
        agiRow.appendChild(agiElem);
        agiRow.appendChild(boost);
        statsTable.append(agiRow);
    }

    parent_elem.append(statsTable);
}

function displayPowderSpecials(parent_elem, powderSpecials, build) {
    parent_elem.textContent = "Powder Specials";
    let specials = powderSpecials.slice();
    let stats = build.statMap;
    let expandedStats = new Map();
    //each entry of powderSpecials is [ps, power]
    for (special of specials) {
        //iterate through the special and display its effects.
        let powder_special = document.createElement("p");
        powder_special.classList.add("left");
        let specialSuffixes = new Map([ ["Duration", " sec"], ["Radius", " blocks"], ["Chains", ""], ["Damage", "%"], ["Damage Boost", "%"], ["Knockback", " blocks"] ]);
        let specialTitle = document.createElement("p");
        let specialEffects = document.createElement("p");
        specialTitle.classList.add("left");
        specialTitle.classList.add("itemp");
        specialTitle.classList.add(damageClasses[powderSpecialStats.indexOf(special[0]) + 1]);
        specialEffects.classList.add("left");
        specialEffects.classList.add("itemp");
        specialEffects.classList.add("nocolor");
        let effects = special[0]["weaponSpecialEffects"];
        let power = special[1];
        specialTitle.textContent = special[0]["weaponSpecialName"] + " " + Math.floor((power-1)*0.5 + 4) + (power % 2 == 0 ? ".5" : "");  
        for (const [key,value] of effects) {
            let effect = document.createElement("p");
            effect.classList.add("itemp");
            effect.textContent += key + ": " + value[power-1] + specialSuffixes.get(key);
            if(key === "Damage"){
                effect.textContent += elementIcons[powderSpecialStats.indexOf(special[0])];
            }
            if(special[0]["weaponSpecialName"] === "Wind Prison" && key === "Damage Boost") {
                effect.textContent += " (only 1st hit)";
            }
            specialEffects.appendChild(effect);
        }

        powder_special.appendChild(specialTitle);
        powder_special.appendChild(specialEffects);

        //if this special is an instant-damage special (Quake, Chain Lightning, Courage Burst), display the damage.
        let specialDamage = document.createElement("p");
        let spells = spell_table["powder"];
        if (powderSpecialStats.indexOf(special[0]) == 0 || powderSpecialStats.indexOf(special[0]) == 1 || powderSpecialStats.indexOf(special[0]) == 3) { //Quake, Chain Lightning, or Courage
            let spell = (powderSpecialStats.indexOf(special[0]) == 3 ? spells[2] : spells[powderSpecialStats.indexOf(special[0])]);
            let part = spell["parts"][0];
            let _results = calculateSpellDamage(stats, part.conversion,
                stats.get("mdRaw"), stats.get("mdPct") + build.externalStats.get("mdPct"), 
                0, build.weapon, build.total_skillpoints, build.damageMultiplier * ((part.multiplier[power-1] / 100)), build.externalStats);//part.multiplier[power] / 100

            let critChance = skillPointsToPercentage(build.total_skillpoints[1]);
            let save_damages = [];
            
            let totalDamNormal = _results[0];
            let totalDamCrit = _results[1];
            let results = _results[2];
            for (let i = 0; i < 6; ++i) {
                for (let j in results[i]) {
                    results[i][j] = results[i][j].toFixed(2);
                }
            }
            let nonCritAverage = (totalDamNormal[0]+totalDamNormal[1])/2 || 0;
            let critAverage = (totalDamCrit[0]+totalDamCrit[1])/2 || 0;
            let averageDamage = (1-critChance)*nonCritAverage+critChance*critAverage || 0;

            let averageLabel = document.createElement("p");
            averageLabel.textContent = "Average: "+averageDamage.toFixed(2);
            averageLabel.classList.add("damageSubtitle");
            specialDamage.append(averageLabel);


            let nonCritLabel = document.createElement("p");
            nonCritLabel.textContent = "Non-Crit Average: "+nonCritAverage.toFixed(2);
            nonCritLabel.classList.add("damageSubtitle");
            specialDamage.append(nonCritLabel);
            
            for (let i = 0; i < 6; i++){
                if (results[i][1] > 0){
                    let p = document.createElement("p");
                    p.classList.add("damagep");
                    p.classList.add(damageClasses[i]);
                    p.textContent = results[i][0]+"-"+results[i][1];
                    specialDamage.append(p);
                }
            }
            let normalDamage = document.createElement("p");
            normalDamage.textContent = "Total: " + totalDamNormal[0].toFixed(2) + "-" + totalDamNormal[1].toFixed(2);
            normalDamage.classList.add("itemp");
            specialDamage.append(normalDamage);

            let nonCritChanceLabel = document.createElement("p");
            nonCritChanceLabel.textContent = "Non-Crit Chance: " + ((1-critChance)*100).toFixed(2)  + "%";
            specialDamage.append(nonCritChanceLabel);

            let critLabel = document.createElement("p");
            critLabel.textContent = "Crit Average: "+critAverage.toFixed(2);
            critLabel.classList.add("damageSubtitle");
            
            specialDamage.append(critLabel);
            for (let i = 0; i < 6; i++){
                if (results[i][1] > 0){
                    let p = document.createElement("p");
                    p.classList.add("damagep");
                    p.classList.add(damageClasses[i]);
                    p.textContent = results[i][2]+"-"+results[i][3];
                    specialDamage.append(p);
                }
            }
            let critDamage = document.createElement("p");
            critDamage.textContent = "Total: " + totalDamCrit[0].toFixed(2) + "-" + totalDamCrit[1].toFixed(2);
            critDamage.classList.add("itemp");
            specialDamage.append(critDamage);

            let critChanceLabel = document.createElement("p");
            critChanceLabel.textContent = "Crit Chance: " + (critChance*100).toFixed(2) + "%";
            specialDamage.append(critChanceLabel);

            save_damages.push(averageDamage);

            powder_special.append(specialDamage);
        } 

        parent_elem.appendChild(powder_special);
    }
}

function displaySpellDamage(parent_elem, overallparent_elem, build, spell, spellIdx) {
    parent_elem.textContent = "";


    let tooltip; let tooltiptext;
    const stats = build.statMap;
    let title_elem = document.createElement("p");
    title_elem.classList.add("smalltitle");
    title_elem.classList.add("Normal");

    overallparent_elem.textContent = "";
    let title_elemavg = document.createElement("p");
    title_elemavg.classList.add('smalltitle');
    title_elemavg.classList.add('Normal');

    if (spellIdx != 0) {
        let first = document.createElement("b");    
        first.textContent = spell.title + " (";
        title_elem.appendChild(first.cloneNode(true)); //cloneNode is needed here.
        title_elemavg.appendChild(first);

        let second = document.createElement("b");
        second.textContent = build.getSpellCost(spellIdx, spell.cost);
        second.classList.add("Mana");
        second.classList.add("tooltip");

        let int_redux = skillPointsToPercentage(build.total_skillpoints[2]).toFixed(2);
        let spPct_redux = (build.statMap.get("spPct" + spellIdx)/100).toFixed(2);
        let spRaw_redux = (build.statMap.get("spRaw" + spellIdx)).toFixed(2);
        spPct_redux >= 0 ? spPct_redux = "+ " + spPct_redux : spPct_redux = "- " + Math.abs(spPct_redux);
        spRaw_redux >= 0 ? spRaw_redux = "+ " + spRaw_redux : spRaw_redux = "- " + Math.abs(spRaw_redux);

        tooltiptext = `= max(1, floor((ceil(${spell.cost} * (1 - ${int_redux})) ${spRaw_redux}) * (1 ${spPct_redux})))`;
        tooltip = createTooltip(tooltip, "p", tooltiptext, second, ["spellcostcalc"]);
        second.appendChild(tooltip);
        title_elem.appendChild(second.cloneNode(true));
        title_elemavg.appendChild(second);
        

        let third = document.createElement("b");
        third.textContent = ") [Base: " + build.getBaseSpellCost(spellIdx, spell.cost) + " ]";
        title_elem.appendChild(third);
        let third_summary = document.createElement("b");
        third_summary.textContent = ")";
        title_elemavg.appendChild(third_summary);
    }
    else {
        title_elem.textContent = spell.title;
        title_elemavg.textContent = spell.title;
    }

    parent_elem.append(title_elem);
    overallparent_elem.append(title_elemavg);

    let critChance = skillPointsToPercentage(build.total_skillpoints[1]);

    let save_damages = [];

    let part_divavg = document.createElement("p");
    part_divavg.classList.add("lessbottom");
    overallparent_elem.append(part_divavg);

    let spell_parts;
    if (spell.parts) {
        spell_parts = spell.parts;
    }
    else {
        spell_parts = spell.variants.DEFAULT;
        for (const majorID of stats.get("activeMajorIDs")) {
            if (majorID in spell.variants) {
                spell_parts = spell.variants[majorID];
                break;
            }
        }
    }
    //console.log(spell_parts);

    for (const part of spell_parts) {
        parent_elem.append(document.createElement("br"));
        let part_div = document.createElement("p");
        parent_elem.append(part_div);

        let subtitle_elem = document.createElement("p");
        subtitle_elem.textContent = part.subtitle;
        subtitle_elem.classList.add("nomargin");
        part_div.append(subtitle_elem);

        if (part.type === "damage") {
            //console.log(build.expandedStats);
            let _results = calculateSpellDamage(stats, part.conversion,
                                    stats.get("sdRaw") + stats.get("rainbowRaw"), stats.get("sdPct") + build.externalStats.get("sdPct"), 
                                    part.multiplier / 100, build.weapon, build.total_skillpoints, build.damageMultiplier, build.externalStats);
            let totalDamNormal = _results[0];
            let totalDamCrit = _results[1];
            let results = _results[2];
            let tooltipinfo = _results[3];
            
            for (let i = 0; i < 6; ++i) {
                for (let j in results[i]) {
                    results[i][j] = results[i][j].toFixed(2);
                }
            }
            let nonCritAverage = (totalDamNormal[0]+totalDamNormal[1])/2 || 0;
            let critAverage = (totalDamCrit[0]+totalDamCrit[1])/2 || 0;
            let averageDamage = (1-critChance)*nonCritAverage+critChance*critAverage || 0;

            let averageLabel = document.createElement("p");
            averageLabel.textContent = "Average: "+averageDamage.toFixed(2);
            tooltiptext = ` = ((1 - ${critChance}) * ${nonCritAverage.toFixed(2)}) + (${critChance} * ${critAverage.toFixed(2)})`
            averageLabel.classList.add("damageSubtitle");
            tooltip = createTooltip(tooltip, "p", tooltiptext, averageLabel, ["spell-tooltip"]);
            part_div.append(averageLabel);


            if (part.summary == true) {
                let overallaverageLabel = document.createElement("p");
                let first = document.createElement("b");
                let second = document.createElement("b");
                first.textContent = part.subtitle + " Average: "; 
                second.textContent = averageDamage.toFixed(2);
                overallaverageLabel.appendChild(first);
                overallaverageLabel.appendChild(second);
                tooltip = createTooltip(tooltip, "p", tooltiptext, overallaverageLabel, ["spell-tooltip", "summary-tooltip"]);
                second.classList.add("Damage");
                overallaverageLabel.classList.add("itemp");
                part_divavg.append(overallaverageLabel);
            }
            
            function _damage_display(label_text, average, result_idx) {
                let label = document.createElement("p");
                label.textContent = label_text+average.toFixed(2);
                label.classList.add("damageSubtitle");
                part_div.append(label);
                
                let arrmin = [];
                let arrmax = [];
                for (let i = 0; i < 6; i++){
                    if (results[i][1] != 0){
                        let p = document.createElement("p");
                        p.classList.add("damagep");
                        p.classList.add(damageClasses[i]);
                        p.textContent = results[i][result_idx] + " \u2013 " + results[i][result_idx + 1];
                        tooltiptext = tooltipinfo.get("damageformulas")[i].slice(0,2).join("\n");
                        tooltip = createTooltip(tooltip, "p", tooltiptext, p, ["spell-tooltip"]);
                        arrmin.push(results[i][result_idx]);
                        arrmax.push(results[i][result_idx + 1]);
                        part_div.append(p);
                    }
                }
                tooltiptext = ` = ((${arrmin.join(" + ")}) + (${arrmax.join(" + ")})) / 2`;
                tooltip = createTooltip(tooltip, "p", tooltiptext, label, ["spell-tooltip"]);
            }
            _damage_display("Non-Crit Average: ", nonCritAverage, 0);
            _damage_display("Crit Average: ", critAverage, 2);

            save_damages.push(averageDamage);
        } else if (part.type === "heal") {
            let heal_amount = (part.strength * build.getDefenseStats()[0] * Math.max(0.5,Math.min(1.75, 1 + 0.5 * stats.get("wDamPct")/100))).toFixed(2);
            tooltiptext = ` = ${part.strength} * ${build.getDefenseStats()[0]} * max(0.5, min(1.75, 1 + 0.5 * ${stats.get("wDamPct")/100}))`;
            let healLabel = document.createElement("p");
            healLabel.textContent = heal_amount;
            healLabel.classList.add("damagep");
            tooltip = createTooltip(tooltip, "p", tooltiptext, healLabel, ["spell-tooltip"]);
            part_div.append(healLabel);
            if (part.summary == true) {
                let overallhealLabel = document.createElement("p");
                let first = document.createElement("b");
                let second = document.createElement("b");
                first.textContent = part.subtitle + ": ";
                second.textContent = heal_amount;
                overallhealLabel.appendChild(first);
                second.classList.add("Set");
                overallhealLabel.appendChild(second);
                overallhealLabel.classList.add("itemp");
                tooltip = createTooltip(tooltip, "p", tooltiptext, second, ["spell-tooltip"]);
                part_divavg.append(overallhealLabel);

                let effectiveHealLabel = document.createElement("p");
                first = document.createElement("b");
                second = document.createElement("b");
                let defStats = build.getDefenseStats();
                tooltiptext = ` = ${heal_amount} * ${defStats[1][0].toFixed(2)} / ${defStats[0]}`;
                first.textContent = "Effective Heal: ";
                second.textContent = (defStats[1][0]*heal_amount/defStats[0]).toFixed(2);
                effectiveHealLabel.appendChild(first);
                second.classList.add("Set");
                effectiveHealLabel.appendChild(second);
                effectiveHealLabel.classList.add("itemp");
                tooltip = createTooltip(tooltip, "p", tooltiptext, second, ["spell-tooltip"]);
                part_divavg.append(effectiveHealLabel);
            }
        } else if (part.type === "total") {
            let total_damage = 0;
            tooltiptext = "";
            for (let i in part.factors) {
                total_damage += save_damages[i] * part.factors[i];
            }

            let dmgarr = part.factors.slice();
            dmgarr = dmgarr.map(x => "(" + x + " * " + save_damages[dmgarr.indexOf(x)].toFixed(2) + ")");
            tooltiptext = " = " + dmgarr.join(" + ");


            let averageLabel = document.createElement("p");
            averageLabel.textContent = "Average: "+total_damage.toFixed(2);
            averageLabel.classList.add("damageSubtitle");
            tooltip = createTooltip(tooltip, "p", tooltiptext, averageLabel, ["spell-tooltip"]);
            part_div.append(averageLabel);

            let overallaverageLabel = document.createElement("p");
            overallaverageLabel.classList.add("damageSubtitle");
            let overallaverageLabelFirst = document.createElement("b");
            let overallaverageLabelSecond = document.createElement("b");
            overallaverageLabelFirst.textContent = "Average: ";
            overallaverageLabelSecond.textContent = total_damage.toFixed(2);
            overallaverageLabelSecond.classList.add("Damage");
            tooltip = createTooltip(tooltip, "p", tooltiptext, overallaverageLabel, ["spell-tooltip", "summary-tooltip"]);


            overallaverageLabel.appendChild(overallaverageLabelFirst);
            overallaverageLabel.appendChild(overallaverageLabelSecond);
            part_divavg.append(overallaverageLabel);
        }
    }
}

/** Displays the ID costs of an item
 * 
 * @param {String} elemID - the id of the parent element.
 * @param {Map} item - the statMap of an item. 
 */
function displayIDCosts(elemID, item) {
    let parent_elem = document.getElementById(elemID);
    let tier = item.get("tier");
    if ( (item.has("fixID") && item.get("fixID")) || ["Normal","Crafted","Custom","none", " ",].includes(item.get("tier"))) {
        return;
    } else {
        /** Returns the number of inventory slots minimum an amount of emeralds would take up + the configuration of doing so.
         * Returns an array of [invSpace, E, EB, LE, Stx LE]
         * 
         * @param {number} ems - the total numerical value of emeralds to compact.
         */
        function emsToInvSpace(ems) {
            let stx = Math.floor(ems/262144);
            ems -= stx*4096*64;
            let LE = Math.floor(ems/4096);
            ems -= LE*4096;
            let EB = Math.floor(ems/64);
            ems -= EB*64;
            let e = ems;
            return [ stx + Math.ceil(LE/64) + Math.ceil(EB/64) + Math.ceil(e/64) , e, EB, LE, stx];
        }
        /**
         * 
         * @param {String} tier - item tier
         * @param {Number} lvl - item level 
         */
        function getIDCost(tier, lvl) {
            switch (tier) {
                case "Unique":
                    return Math.round(0.5*lvl + 3);
                case "Rare":
                    return Math.round(1.2*lvl + 8);
                case "Legendary":
                    return Math.round(4.5*lvl + 12);
                case "Fabled":
                    return Math.round(12*lvl + 26);
                case "Mythic":
                    return Math.round(18*lvl + 90);
                case "Set":
                    return Math.round(1.5*lvl + 8)
                default:
                    return -1;
            }
        }

        parent_elem.style = "display: visible";
        let lvl = item.get("lvl");
        if (typeof(lvl) === "string") { lvl = parseFloat(lvl); }
        
        let title_elem = document.createElement("p");
        title_elem.classList.add("smalltitle");
        title_elem.style.color = "white";
        title_elem.textContent = "Identification Costs";
        parent_elem.appendChild(title_elem);
        parent_elem.appendChild(document.createElement("br"));

        let grid_item = document.createElement("div");
        grid_item.style.display = "flex";
        grid_item.style.flexDirection = "rows";
        grid_item.style.flexWrap = "wrap";
        grid_item.style.gap = "5px";
        parent_elem.appendChild(grid_item);

        let IDcost = getIDCost(tier, lvl);
        let initIDcost = IDcost;
        let invSpace = emsToInvSpace(IDcost);
        let rerolls = 0;

        while(invSpace[0] <= 28 && IDcost > 0) {
            let container = document.createElement("div");
            container.classList.add("container");
            container.style = "grid-item-" + (rerolls+1);
            container.style.maxWidth = "max(120px, 15%)";
            
            let container_title = document.createElement("p");
            container_title.style.color = "white";
            if (rerolls == 0) {
                container_title.textContent = "Initial ID Cost: ";
            } else {
                container_title.textContent = "Reroll to [" + (rerolls+1) + "] Cost:";
            }
            container.appendChild(container_title);
            let total_cost_container = document.createElement("p");
            let total_cost_number = document.createElement("b");
            total_cost_number.classList.add("Set");
            total_cost_number.textContent = IDcost + " ";
            let total_cost_suffix = document.createElement("b");
            total_cost_suffix.textContent = "emeralds."
            total_cost_container.appendChild(total_cost_number);
            total_cost_container.appendChild(total_cost_suffix);
            container.appendChild(total_cost_container);

            let OR = document.createElement("p");
            OR.classList.add("center");
            OR.textContent = "OR";
            container.appendChild(OR);

            let esuffixes = ["", "emeralds.", "EB.", "LE.", "stacks of LE."];
            for (let i = 4; i > 0; i--) {
                let n_container = document.createElement("p");
                let n_number = document.createElement("b");
                n_number.classList.add("Set");
                n_number.textContent = invSpace[i] + " ";
                let n_suffix = document.createElement("b");
                n_suffix.textContent = esuffixes[i];
                n_container.appendChild(n_number);
                n_container.appendChild(n_suffix);
                container.appendChild(n_container);
            }
            grid_item.appendChild(container);
            
            rerolls += 1;
            IDcost = Math.round(initIDcost * (5 ** rerolls));
            invSpace = emsToInvSpace(IDcost);
        }
    }
}

/** Displays Additional Info for 
 * 
 * @param {String} elemID - the parent element's id 
 * @param {Map} item - the statMap of the item
 * @returns 
 */
function displayAdditionalInfo(elemID, item) {
    let parent_elem = document.getElementById(elemID);
    parent_elem.classList.add("left");

    let droptype_elem = document.createElement("div");
    droptype_elem.classList.add("container");
    droptype_elem.style.marginBottom = "5px";
    droptype_elem.textContent = "Drop type: " + (item.has("drop") ? item.get("drop"): "NEVER");
    parent_elem.appendChild(droptype_elem);

    let warning_elem = document.createElement("div");
    warning_elem.classList.add("container");
    warning_elem.style.marginBottom ="5px";
    warning_elem.textContent = "This page is incomplete. Will work on it later.";
    parent_elem.appendChild(warning_elem);

    return;
}

/** Displays all set bonuses (0/n, 1/n, ... n/n) for a given set
 * 
 * @param {String} parent_id - id of the parent element
 * @param {String} setName - the name of the set
 */
 function displayAllSetBonuses(parent_id,setName) {
    let parent_elem = document.getElementById(parent_id);
    parent_elem.style.display = ""; 
    let set = sets[setName];
    let title_elem = document.createElement("p");
    title_elem.textContent = setName + " Set Bonuses";
    title_elem.classList.add("Set");
    title_elem.classList.add("title");
    parent_elem.appendChild(title_elem);
    let grid_elem = document.createElement("div");
    grid_elem.style.display = "flex";
    grid_elem.style.flexDirection = "rows";
    grid_elem.style.flexWrap = "wrap";
    grid_elem.style.gap = "5px";
    parent_elem.appendChild(grid_elem);

    for (let i = 0; i < set.items.length; i++) {
        
        let set_elem = document.createElement('p');
        set_elem.classList.add("container");
        set_elem.style = "grid-item-"+(i+1);
        set_elem.style.maxWidth = "max(180px, 15%)";
        set_elem.id = "set-"+setName+"-"+i;
        grid_elem.appendChild(set_elem);
        const bonus = set.bonuses[i];
        let mock_item = new Map();
        mock_item.set("fixID", true);
        mock_item.set("displayName", setName+" Set: " + (i+1) + "/"+sets[setName].items.length);
        set_elem.textContent = mock_item.get("displayName");
        let mock_minRolls = new Map();
        let mock_maxRolls = new Map();
        mock_item.set("minRolls", mock_minRolls);
        mock_item.set("maxRolls", mock_maxRolls);
        for (const id in bonus) {
            if (rolledIDs.includes(id)) {
                mock_minRolls.set(id, bonus[id]);
                mock_maxRolls.set(id, bonus[id]);
            }
            else {
                mock_item.set(id, bonus[id]);
            }
        }
        mock_item.set("powders", []);
        displayExpandedItem(mock_item, set_elem.id);
    }

}

/** Displays the individual probabilities of each possible value of each rollable ID for this item.
 * 
 * @param {String} parent_id the document id of the parent element
 * @param {String} item expandedItem object
 * @param {String} amp the level of corkian amplifier used. 0 means no amp, 1 means Corkian Amplifier I, etc. [0,3]
 */
function displayIDProbabilities(parent_id, item, amp) {
    if (item.has("fixID") && item.get("fixID")) {return}
    let parent_elem = document.getElementById(parent_id);
    parent_elem.style.display = "";
    parent_elem.innerHTML = "";
    let title_elem = document.createElement("p");
    title_elem.textContent = "Identification Probabilities";
    title_elem.id = "ID_PROB_TITLE";
    title_elem.classList.add("Legendary");
    title_elem.classList.add("title");
    parent_elem.appendChild(title_elem);
    
    let disclaimer_elem = document.createElement("p");
    disclaimer_elem.textContent = "IDs are rolled on a uniform distribution. A chance of 0% means that either the minimum or maximum possible multiplier must be rolled to get this value."
    parent_elem.appendChild(disclaimer_elem);

    let amp_row = document.createElement("p");
    amp_row.id = "amp_row";
    let amp_text = document.createElement("b");
    amp_text.textContent = "Corkian Amplifier Used: "
    amp_row.appendChild(amp_text);
    let amp_1 = document.createElement("button");
    amp_1.id = "cork_amp_1";
    amp_1.textContent = "I";
    amp_row.appendChild(amp_1);
    let amp_2 = document.createElement("button");
    amp_2.id = "cork_amp_2";
    amp_2.textContent = "II";
    amp_row.appendChild(amp_2);
    let amp_3 = document.createElement("button");
    amp_3.id = "cork_amp_3";
    amp_3.textContent = "III";
    amp_row.appendChild(amp_3);
    amp_1.addEventListener("click", (event) => {toggleAmps(1)});
    amp_2.addEventListener("click", (event) => {toggleAmps(2)});
    amp_3.addEventListener("click", (event) => {toggleAmps(3)});
    parent_elem.appendChild(amp_row);
    
    if (amp != 0) {toggleButton("cork_amp_" + amp)}

    let item_name = item.get("displayName");
    console.log(itemMap.get(item_name))
    
    let table_elem = document.createElement("table");
    parent_elem.appendChild(table_elem);
    for (const [id,val] of Object.entries(itemMap.get(item_name))) {
        if (rolledIDs.includes(id)) {
            let min = item.get("minRolls").get(id);
            let max = item.get("maxRolls").get(id);
            //Apply corkian amps
            if (val > 0) {
                let base = itemMap.get(item_name)[id];
                if (reversedIDs.includes(id)) {max = Math.max( Math.round((0.3 + 0.05*amp) * base), 1)} 
                else {min = Math.max( Math.round((0.3 + 0.05*amp) * base), 1)}
            }

            let row_title = document.createElement("tr");
            //row_title.style.textAlign = "left";
            let title_left = document.createElement("td");
            let left_elem = document.createElement("p");
            let left_val_title = document.createElement("b");
            let left_val_elem = document.createElement("b");
            title_left.style.textAlign = "left";
            left_val_title.textContent = idPrefixes[id] + "Base ";
            left_val_elem.textContent = val + idSuffixes[id];
            if (val > 0 == !reversedIDs.includes(id)) {
                left_val_elem.classList.add("positive");
            } else if (val > 0 == reversedIDs.includes(id)) {
                left_val_elem.classList.add("negative");
            }
            left_elem.appendChild(left_val_title);
            left_elem.appendChild(left_val_elem);
            title_left.appendChild(left_elem);
            row_title.appendChild(title_left);

            let title_right = document.createElement("td");
            let title_right_text = document.createElement("b");
            title_right.style.textAlign = "left";
            title_right_text.textContent = "[ " + min + idSuffixes[id] + ", " + max + idSuffixes[id] + " ]";
            if ( (min > 0 && max > 0 && !reversedIDs.includes(id)) || (min < 0 && max < 0 && reversedIDs.includes(id)) ) {
                title_right_text.classList.add("positive");
            } else if ( (min < 0 && max < 0 && !reversedIDs.includes(id)) || (min > 0 && max > 0 && reversedIDs.includes(id)) ) {
                title_right_text.classList.add("negative");
            }
            title_right.appendChild(title_right_text);

            let title_input = document.createElement("td");
            let title_input_slider = document.createElement("input");
            title_input_slider.type = "range";
            title_input_slider.id = id+"-slider";
            if (!reversedIDs.includes(id)) {
                title_input_slider.step = 1;
                title_input_slider.min = `${min}`;
                title_input_slider.max = `${max}`;
                title_input_slider.value = `${max}`;
            } else {
                title_input_slider.step = 1;
                title_input_slider.min = `${-1*min}`;
                title_input_slider.max = `${-1*max}`;
                title_input_slider.value = `${-1*max}`;
            }
            let title_input_textbox = document.createElement("input");
            title_input_textbox.type = "text";
            title_input_textbox.value = `${max}`;
            title_input_textbox.id = id+"-textbox";
            title_input_textbox.classList.add("small-input");
            title_input.appendChild(title_input_slider);
            title_input.appendChild(title_input_textbox);
            
            row_title.appendChild(title_left);
            row_title.appendChild(title_right);
            row_title.appendChild(title_input);

            let row_chances = document.createElement("tr");
            let chance_cdf = document.createElement("td");
            let chance_pdf = document.createElement("td");
            let cdf_p = document.createElement("p");
            cdf_p.id = id+"-cdf";
            let pdf_p = document.createElement("p");
            pdf_p.id = id+"-pdf";

            chance_cdf.appendChild(cdf_p);
            chance_pdf.appendChild(pdf_p);
            row_chances.appendChild(chance_cdf);
            row_chances.appendChild(chance_pdf);

            table_elem.appendChild(row_title);
            table_elem.appendChild(row_chances);

            

            stringPDF(id, max, val, amp); //val is base roll
            stringCDF(id, max, val, amp); //val is base roll
            title_input_slider.addEventListener("change", (event) => {
                let id_name = event.target.id.split("-")[0];
                let textbox_elem = document.getElementById(id_name+"-textbox");

                if (reversedIDs.includes(id_name)) {
                    if (event.target.value < -1*min) { event.target.value = -1*min}
                    if (event.target.value > -1*max) { event.target.value = -1*max}
                    stringPDF(id_name, -1*event.target.value, val, amp); //val is base roll
                    stringCDF(id_name, -1*event.target.value, val, amp); //val is base roll
                } else {    
                    if (event.target.value < min) { event.target.value = min}
                    if (event.target.value > max) { event.target.value = max}
                    stringPDF(id_name, 1*event.target.value, val, amp); //val is base roll
                    stringCDF(id_name, 1*event.target.value, val, amp); //val is base roll
                }

                if (textbox_elem && textbox_elem.value !== event.target.value) {
                    if (reversedIDs.includes(id_name)) {
                        textbox_elem.value = -event.target.value;
                    } else {
                        textbox_elem.value = event.target.value;
                    }
                }
                
                
            });
            title_input_textbox.addEventListener("change", (event) => {
                let id_name = event.target.id.split("-")[0];
                if (reversedIDs.includes(id_name)) {
                    if (event.target.value > min) { event.target.value = min}
                    if (event.target.value < max) { event.target.value = max}
                } else {    
                    if (event.target.value < min) { event.target.value = min}
                    if (event.target.value > max) { event.target.value = max}
                }
                let slider_elem = document.getElementById(id_name+"-slider");
                if (slider_elem.value !== event.target.value) {
                    slider_elem.value = -event.target.value;    
                }

                stringPDF(id_name, 1*event.target.value, val, amp); 
                stringCDF(id_name, 1*event.target.value, val, amp); 
            });
        }
    }
}

//helper functions. id - the string of the id's name, val - the value of the id, base - the base value of the item for this id
function stringPDF(id,val,base,amp) {
    /** [0.3b,1.3b] positive normal
     *  [1.3b,0.3b] positive reversed
     *  [1.3b,0.7b] negative normal
     *  [0.7b,1.3b] negative reversed
     * 
     *  [0.3, 1.3] minr, maxr [0.3b, 1.3b] min, max
     *  the minr/maxr decimal roll that corresponds to val -> minround, maxround
     */
    let p; let min; let max; let minr; let maxr; let minround; let maxround;
    if (base > 0) {
        minr = 0.3 + 0.05*amp; maxr = 1.3;
        min = Math.max(1, Math.round(minr*base)); max = Math.max(1, Math.round(maxr*base));
        minround = (min == max) ? (minr) : ( Math.max(minr, (val-0.5) / base) );
        maxround = (min == max) ? (maxr) : ( Math.min(maxr, (val+0.5) / base) );
    } else {
        minr = 1.3; maxr = 0.7;
        min = Math.min(-1, Math.round(minr*base)); max = Math.min(-1, Math.round(maxr*base));
        minround = (min == max) ? (minr) : ( Math.min(minr, (val-0.5) / base) );
        maxround = (min == max) ? (maxr) : ( Math.max(maxr, (val+0.5) / base) );
    }
    
    p = Math.abs(maxround-minround)/Math.abs(maxr-minr)*100;
    p = p.toFixed(3);

    let b1 = document.createElement("b");
    b1.textContent = "Roll exactly ";
    let b2 = document.createElement("b");
    b2.textContent = val + idSuffixes[id];
    if (val > 0 == !reversedIDs.includes(id)) {b2.classList.add("positive")}
    if (val > 0 == reversedIDs.includes(id)) {b2.classList.add("negative")}
    let b3 = document.createElement("b");
    b3.textContent = ": " + p + "%";
    document.getElementById(id + "-pdf").innerHTML = "";
    document.getElementById(id + "-pdf").appendChild(b1);
    document.getElementById(id + "-pdf").appendChild(b2);
    document.getElementById(id + "-pdf").appendChild(b3);
    document.getElementById(id + "-pdf").style.textAlign = "left";
}
function stringCDF(id,val,base,amp) {
    let p; let min; let max; let minr; let maxr; let minround; let maxround;
    if (base > 0) {
        minr = 0.3 + 0.05*amp; maxr = 1.3;
        min = Math.max(1, Math.round(minr*base)); max = Math.max(1, Math.round(maxr*base));
        minround = (min == max) ? (minr) : ( Math.max(minr, (val-0.5) / base) );
        maxround = (min == max) ? (maxr) : ( Math.min(maxr, (val+0.5) / base) );
    } else {
        minr = 1.3; maxr = 0.7;
        min = Math.min(-1, Math.round(minr*base)); max = Math.min(-1, Math.round(maxr*base));
        minround = (min == max) ? (minr) : ( Math.min(minr, (val-0.5) / base) );
        maxround = (min == max) ? (maxr) : ( Math.max(maxr, (val+0.5) / base) );
    }

    if (reversedIDs.includes(id)) {
        p = Math.abs(minr-maxround)/Math.abs(maxr-minr)*100;
    } else {
        p = Math.abs(maxr-minround)/Math.abs(maxr-minr)*100;
    }
    p = p.toFixed(3);
    
    let b1 = document.createElement("b");
    b1.textContent = "Roll ";
    let b2 = document.createElement("b");
    b2.textContent = val + idSuffixes[id];
    if (val > 0 == !reversedIDs.includes(id)) {b2.classList.add("positive")}
    if (val > 0 == reversedIDs.includes(id)) {b2.classList.add("negative")}
    let b3 = document.createElement("b");
    b3.textContent= " or better: " + p + "%";
    document.getElementById(id + "-cdf").innerHTML = "";
    document.getElementById(id + "-cdf").appendChild(b1);
    document.getElementById(id + "-cdf").appendChild(b2);
    document.getElementById(id + "-cdf").appendChild(b3);
    document.getElementById(id + "-cdf").style.textAlign = "left";
}
