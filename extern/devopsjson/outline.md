# devops.json Outline 

###  File Format

JSON

### Filename

/devops.json

## Information Provided

### Name (Required), Description (Required) and Tags (Optional)

Should be formatted for display.
Tags are for Search Engine Optimization
 
````
  "name": "Gutsy",
  "description": "Devops JSON Dashboard",
  "tags": [
    "javascript",
    "express",
    "nodejs",
    "cloud"
  ],
````

### Contacts (Required)

Contacts contains Team objects. At least one team must be provided.

Each Team object contains:

- Teamname (Required)
- Members (Required) Must contain at least one member
    - Name and SSO fields are required
    - Other field names must be valid URI protocols

````
  "contacts": [
    {
      "team_name": "Developers",
      "members": [
        {
          "name":"Weee Beeblebrox",
          "sso":"weee.Beeblebrox",
          "github":"http://github.com/foobar",
          "mailto":"foobar@example.com",
          "ircnick":"zfoobar",
          "callto":"foobar",
          "tel":"+1.555.555.5555"
        },
        {
          "name":"Englebert Humpledink",
          "sso":"englebert.humpledink",
          "github":"http://github.com/bert",
          "mailto":"bert@example.com",
          "ircnick":"berty",
          "callto":"berty",
          "tel":"+1.555.555.1234"
        }
      ]
    },
    {
      "team_name": "Operations",
      "members": [
        {
          "name": "Zaphod Beeblebrox",
          "sso": "zaphod.beeblebrox"
        }, 
        {
          "name": "Ford Prefect",
          "sso":"ford.prefect",
          "github":"http://github.com/bafd",
          "mailto":"ford.prefect@example.com",
          "ircnick":"ford"
        }
      ]
    }
  ],
````

### Links (Optional)

Key can be anything, will be URL anchor text. Value must be a URL.

Useful Examples:

* Docs
* Dashboard
* Code
* Monitoring
* Ticketing / Defects
* CI System
* CD System
* Logs
* IRC / Chat (http://tools.ietf.org/html/rfc5785)

````
  "links": {
      "code": "https://github.example.com/gutsy/gutsy",
      "docs": "https://github.example.com/gutsy/gutsy/wiki",
      "dashboard": "https://gutsy.dev.io",
      "code": "https://github.example.com/gutsy/gutsy",
      "monitoring": "https://cloudkick.com",
      "ticketing": "https://v1.k1k.me",
      "continuous_integration": "https://gutsy-bb.k1k.me",
      "continuous_deployment": "https://gutsy-dreadnot.k1k.me",
      "logging": "https://gutsy-log.k1k.me",
      "chat": "irc://irc.freenode.net:4443/gutsy-dev?4thestars"
  },
````

### Metadata (Optional)

* Current Version of this JSON file
* date deployed : Changedate of JSON File (POSIX time format)

````
  "metadata": {
      "current_version": "1",
      "date_deployed": 1329538942
  },
````

### Environments (Opiontal)

* Production, Staging, etc
* Platform
* Regions to which the environment is deployed 
* URL to Environment
    * Auth is optional, but highly recommended!
 
````
  "environments": [
    {
      "type": "Staging",
      "platforms": ["Ubuntu 10.4"],
      "regions": ["DAT","OMG"],
      "url": {
        "url": "https://staging.example.com",
        "auth": {
          "type": "basic",
          "username": "gutsy",
          "password": "PASS"
        }
      } 
    }
  ],
````

### Related APIs (Optional)

* PagerDuty
* NewRelic
* Cloud Monitoring

````
    "related_apis": {
        "pager_duty": {
          "subdomain": "example",
          "schedule_id": "EDDY42",
          "port": 80,
          "auth": "user:pass"
        }
        "version_one": {
            "host": "www.v1host.com",
            "port": 443,
            "name": "PROJECT",
            "project": 42,
            "auth": "user:pass"
        }
    },
````

### Dependent Services (Optional)

 * Opaque Strings, or, ideally links to a devops.json
 * Auth
 * Usage
 * If you depend on cloud servers, etc

````
    "dependent_services": [
        "http://foo.api.example.com/devops.json",
        "http://auth.api.example.com/devops.json",
        "http://usage.api.example.com/devops.json"
    ],
````

### KPI JSON URI (Optional)

* Actual values
* URLs to get actual values (New Relic API url, but lists keys to use against it?)

````
 "kpi_spec": "http://beta.example.com/kpi.json"
````
