const requireNetwork = (req, res, next) => {
    const allowedNetworks = (process.env.ALLOWED_NETWORKS || '').split(',').filter(Boolean);

    if (allowedNetworks.length === 0) {
        return next();
    }

    const clientIp = req.ip || req.connection.remoteAddress || '';
    const normalizedIp = clientIp.replace('::ffff:', '');

    if (normalizedIp === '127.0.0.1' || normalizedIp === '::1' || normalizedIp === 'localhost') {
        return next();
    }

    const isAllowed = allowedNetworks.some(network => {
        const trimmed = network.trim();
        if (trimmed.includes('/')) {
            return isInSubnet(normalizedIp, trimmed);
        }
        return normalizedIp === trimmed;
    });

    if (!isAllowed) {
        return res.status(403).json({
            error: 'Access denied. Please connect to the college network.',
            required_network: true,
        });
    }

    next();
};

function isInSubnet(ip, cidr) {
    try {
        const [subnet, bits] = cidr.split('/');
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        const ipNum = ipToNumber(ip);
        const subnetNum = ipToNumber(subnet);

        if (ipNum === null || subnetNum === null) return false;

        return (ipNum & mask) === (subnetNum & mask);
    } catch {
        return false;
    }
}

function ipToNumber(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return parts.reduce((sum, part) => (sum << 8) + parseInt(part), 0) >>> 0;
}

module.exports = { requireNetwork };
