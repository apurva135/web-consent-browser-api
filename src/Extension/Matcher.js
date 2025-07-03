class Matcher {
    static createMatcher(config) {
        switch(config.type) {
            case "css": return new CssMatcher(config);
            case "checkbox": return new CheckboxMatcher(config);
            case "url": return new URLMatcher(config);
            default: throw "Unknown matcher type: "+config.type;
        }
    }

    constructor(config) {
        this.config = config;
    }

    matches() {
        console.log("Remember to override matches()");
    }

    async debug(shouldMatch) {
        let result = Tools.find(this.config);

        let blinker = result.parent || result.target;

        if(blinker != null) {
            if(blinker.matches("input")) {
                blinker = blinker.parentNode;
            }

            let matches = this.matches();
            let correct = shouldMatch === matches;

            if (ConsentEngine.debugValues.clickDelay) {
                blinker.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                    inline: "center"
                });
            }

            if(correct) {
                blinker.style.border = "2px solid lime";
                blinker.style.backgroundColor = "lime";
            } else {
                blinker.style.border = "2px solid pink";
                blinker.style.backgroundColor = "pink";
            }

            await new Promise((resolve, reject)=>{
                if (ConsentEngine.debugValues.clickDelay) {
                        setTimeout(()=>{
                        resolve();
                    }, 10);
                } else {
                    resolve();
                }
            });
        }
    }
}

class CssMatcher extends Matcher {
    constructor(config) {
        super(config);
    }

    matches() {
        let result = Tools.find(this.config);

        return result.target != null;
    }
}

class CheckboxMatcher extends Matcher {
    constructor(config) {
        super(config);
    }

    matches() {
        let result = Tools.find(this.config);
        
        if(this.config.negated) {
            console.log("Negated checkbox");

            return result.target != null && !result.target.checked;
        }

        return result.target != null && result.target.checked;
    }
}

class URLMatcher extends Matcher {
    constructor(config) {
        super(config);
    }

    debug() {
        //Overriden to disable
    }

    matches() {
        if (ConsentEngine.debugValues.debugLog) {
            console.log("URL Matcher:", ConsentEngine.topFrameUrl, this.config);
        }

        let urls = this.config.url;
        if(!Array.isArray(urls)) {
            urls = [urls];
        }

        let matched = false;
        
        if(this.config.regexp) {
            for(let url of urls) {
                let regexp = new RegExp(url);
                if(regexp.exec(ConsentEngine.topFrameUrl) !== null) {
                    if (ConsentEngine.debugValues.debugLog) {
                        console.log("Matched URL regexp:", url);
                    }
                    matched = true;
                    break;
                }
            }
        } else {
            for(let url of urls) {
                if(ConsentEngine.topFrameUrl.indexOf(url) > -1) {
                    if (ConsentEngine.debugValues.debugLog) {
                        console.log("Matched URL:", url);
                    }
                    matched = true;
                    break;
                }
            }
        }

        if(this.config.negated) {
            //If the matcher should be negated, negate matched
            matched = !matched;
        }

        if (ConsentEngine.debugValues.debugLog) {
            console.log("Did URLMatcher match (after negate):", matched);
        }

        return matched;
    }
}

export {
    Matcher,
    CssMatcher,
    CheckboxMatcher,
    URLMatcher
}