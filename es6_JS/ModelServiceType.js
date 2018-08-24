/**
 * Created by zoejo on 07/18/17.
 */

/**
 * Services are a somewhat special case type.
 */
class Service{
    /**
     *
     * @param service   The service JSON entity.
     * Note that everything in service.metadata should be picked up, but we choose to make it explicit what we expect
     * may be present.
     */
    constructor(id, type){
        this.kind = 'Service';
        this.uniqueId = id;
        this.id = id;
        this.type = type;
        if(type == "FWrouter"){
            this.metadata = {
                partNumber : "VSRX-1G-STD",
                make : "Juniper",
                model : "VSRX",
                softwareVersion : "15.1X49-D40.6"
            };
        }
        else if(type == "FWwanX"){
            this.metadata = {
                partNumber : "ATT- U401",
                make : "ATT",
                model : "U401",
                description : "AT&T U401 - includes 32 GB RAM, 4 core Intel&reg; processor, 128 GB SSD, 1 WAN port, 8 LAN ports and up to 1 Gbps throughput",
                wan1 : "Electrical",
                modem : "LTE"
            };
        }
        else if(type == "FWfirewall"){
            this.metadata = {
                partNumber : "FortiGate- VM00",
                software : "Fortinet FortiGate – VM00",
                softwareVersion : "15.1X49-D40.6"
            };
        }
        else {
            console.log("Error: Service type mismatch");
        }

    }
}