// constants
var N_0 = 819069.80; // northing of projection origin 
var E_0 = 836694.05; // easting of projection origin
var m_0 = 1; // scale factor
var lat_0 = (22 + 18 / 60 + 43.68 / 3600) * Math.PI / 180; // DMS to radian, lat of projection origin
var lng_0 = (114 + 10 / 60 + 42.80 / 3600) * Math.PI / 180; // DMS to decimal, lng of projection origin

var M_0 = 0; // meridian distance measured from equator to origin
var a = 0;
var f = 0;
var e_squared = 0; // first eccentricity of reference ellipsoid
var e_quad = 0;
var A_0 = 0;
var A_2 = 0;
var A_4 = 0;
var v_s = 0; // radius of curvature in the prime vertical
var p_s = 0; // radius of curvature in the meridian
var psi_s = 0; // isometric latitude

class Constants {
    static initAllConstants(type) {
        if (type == "grid") {
            a = 6378388;
            f = 1 / 297.0;
        } else if (type == "wgs") {
            a = 6378137;
            f = 1 / 298.2572235634;
        }
        e_squared = 2 * f - f * f;
        e_quad = e_squared * e_squared;
        A_0 = 1 - e_squared / 4 - (3 / 64) * e_quad;
        A_2 = 3 / 8 * (e_squared + e_quad / 4);
        A_4 = 15 / 256 * e_quad;
        v_s = a / Math.sqrt((1 - e_squared * Math.pow(Math.sin(lat_0), 2)));
        p_s = a * (1 - e_squared) / Math.pow(Math.sqrt(1 - e_squared * Math.pow(Math.sin(lat_0), 2)), 3);
        psi_s = v_s / p_s;
        M_0 = this.meridianDistance(lat_0);
    }

    static meridianDistance(phi) {
        return a * ((A_0 * phi) - (A_2 * Math.sin(2 * phi)) + (A_4 * Math.sin(4 * phi)));
    }

    static derivativeM(phi) {
        return a * (A_0 - A_2 * 2 * Math.cos(2 * phi) + 4 * A_4 * Math.cos(4 * phi));
    }

    static getPhiP(N) {
        var deltaN = N - N_0;
        var c = (deltaN + M_0) / m_0;
        var error = Math.pow(10, -17);
        var err = 1; // initialize
        var x0 = 0.3;
        // double x1 = 0.4;
        // var x;
        var xn = x0;
        var fxn;
        var i = 1;
        var maxIteration = 500;
        // double fx0;
        // double fx1;
        // double dx;
        // int i = 2;
        // while(err > error) {
        //   fx0 = meridianDistance(x0) - c;
        //   fx1 = meridianDistance(x1) - c;
        //   x = x1 - (x1 - x0) * fx1 / (fx1 - fx0);
        //   x0 = x1;
        //   x1 = x;
        //   err = (x0-x1).abs();
        //   print("x" + i.toString() + " = " + x.toString() + ', error: ' + err.toString());
        //   i ++;
        // }
        while (err > error && i < maxIteration) {
            fxn = this.meridianDistance(xn) - c;
            xn = xn - fxn / this.derivativeM(xn);
            err = Math.abs(fxn);
        }
        return xn;
    }

    static getV(phi) {
        return a / Math.sqrt(1 - (e_squared * Math.pow(Math.sin(phi), 2)));
    }

    static getRoll(phi) {
        return a * (1 - e_squared) / Math.pow(Math.sqrt(1 - e_squared * Math.pow(Math.sin(phi), 2)), 3);
    }

    static getAllConstants(x, y, type) {
        var constants = {};
        this.initAllConstants(type);
        var phiP = this.getPhiP(y);      
        var secantPhiP = 1 / Math.cos(phiP);
        var vP = this.getV(phiP);
        var rollP = this.getRoll(phiP);
        var psiP = vP / rollP;
        var tanP = Math.tan(phiP);
        var deltaE = x - E_0;
        var deltaN = y - N_0;
        constants['phiP'] = phiP;
        constants['secantPhiP'] = secantPhiP;
        constants['vP'] = vP;
        constants['rollP'] = rollP;
        constants['psiP'] = psiP;
        constants['tanP'] = tanP;
        constants['deltaE'] = deltaE;
        constants['deltaN'] = deltaN;
        return constants;
    }
}
/*
==============================
HK80 to WGS84 conversion
==============================
*/
class Conversion {

    xToLng(constants) {
        return lng_0 + constants['secantPhiP'] * (constants['deltaE']) / (m_0 * constants['vP'])
            - constants['secantPhiP'] * (Math.pow(constants['deltaE'], 3) * (constants['psiP'] + 2 * Math.pow(constants['tanP'], 2)) / (6 * Math.pow(m_0 * constants['vP'], 3)));
    }

    yToLat(constants) {
        return constants['phiP'] - constants['tanP'] * Math.pow(constants['deltaE'], 2) / (m_0 * constants['rollP'] * 2 * m_0 * constants['vP']);
    }

    latToY(lat, lng) {
        var latRadian = lat * Math.PI / 180;
        var deltaLng = lng * Math.PI / 180 - lng_0;
        return N_0 + m_0 * (Constants.meridianDistance(latRadian) - M_0 + v_s * Math.sin(latRadian) * Math.pow(deltaLng, 2) / 2 * Math.cos(latRadian));
    }

    lngToX(lat, lng) {
        var latRadian = lat * Math.PI / 180;
        var deltaLng = lng * Math.PI / 180 - lng_0;
        return E_0 + m_0 * (v_s * deltaLng * Math.cos(latRadian) + v_s * Math.pow(deltaLng, 3) / 6 * Math.pow(Math.cos(latRadian), 3) * (psi_s - Math.tan(latRadian)));
    }

    gridToLatLng(coordinate) {
        //assert(coordinate.x != null && coordinate.y != null);
        var constants = Constants.getAllConstants(coordinate.x, coordinate.y, "grid");     // [phiP, vP, rollP, psiP, tanP, deltaE, deltaN]
        var lat = this.yToLat(constants);
        var lng = this.xToLng(constants);
        
        return new Coordinate({
            lat: lat * 180 / Math.PI - 5.5 / 3600,
            lng: lng * 180 / Math.PI + 8.8 / 3600
        });
    }

    latLngToGrid(coordinate) {
        //assert(coordinate.lat != null && coordinate.lng != null);
        Constants.initAllConstants("wgs");
        var lat = coordinate.lat + 5.5 / 3600;
        var lng = coordinate.lng - 8.8 / 3600;
        var x = this.lngToX(lat, lng);
        var y = this.latToY(lat, lng);
        return new Coordinate({x: x, y: y});
    }
}

/*
==============================
Coordinate class
==============================
*/
class Coordinate {
    x = 0;
    y = 0;
    lat = 0;
    lng = 0;

    constructor({ x, y, lat, lng }) {
        this.x = x;
        this.y = y;
        this.lat = lat;
        this.lng = lng;
    }
}

/* //run test
//var conversion = new Conversion();
var latlng = new Conversion().gridToLatLng({ x: 832591.320, y: 820359.389 })
console.log(latlng);    
//  output 
//  { 832591.320, 820359.389 } <=> { 22.32224623226597, 114.14117941335034 }
//  geodetic prefer
//  { 832591.320, 820359.389 } <=> { 22.322244329, 114.141187898 }

var grid = new Conversion().latLngToGrid({ lat: 22.322244329, lng: 114.141187898 })
console.log(grid);
//  output
//  { 832592.3659444861, 820359.1560793322 } <=> { 22.322244329, 114.141187898 }
//  geodetic prefer
//  { 832591.320, 820359.389 } <=> { 22.322244329, 114.141187898 } */