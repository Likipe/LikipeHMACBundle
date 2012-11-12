<?php

namespace Likipe\HMACBundle\NonceValidator;

use Likipe\HMACBundle\NonceValidatorInterface;

abstract class AbstractNonceValidator implements NonceValidatorInterface
{
	/**
	 * Validates the format of the nonce and also asks timestampIsValid if
	 * the supplied timestamp falls within the accepted range.
	 */
	public function isValid($macId, $nonce)
	{
		if( ! preg_match('/^([0-9]+):([\x20\x21\x23-\x5B\x5D-\x7E]+)$/', $nonce, $result)) {
			return false;
		}
		
		return $this->nonceIsValid($macId, (int)$result[1], $result[2]);
	}
	
	/**
	 * @param  string  The mac key identifier
	 * @param  int     Timestamp of the nonce
	 * @param  string  Random characters of the nonce, guaranteed to match
	 *                 the regex [\x20\x21\x23-\x5B\x5D-\x7E]+
	 * @return bool    True if the nonce is valid, false otherwise
	 */
	abstract public function nonceIsValid($macId, $timestamp, $random);
}
