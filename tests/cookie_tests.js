function CookieTests() {

}

CookieTests.prototype.testAdd = function() {
    Mojo.requireEqual(2, 1+1, "One plus one must equal two.")
    return Mojo.Test.passed
}